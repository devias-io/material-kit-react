"use client";
// src/hooks/useNotifications.ts

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';
import type { ReactNode } from 'react';

import type { NotificationStreamEvent } from '@/types/notifications';

const isDevelopment = process.env.NODE_ENV === 'development';
const MAX_STREAM_RETRIES = 2;
const STREAM_DEBOUNCE_MS = 10000;
const AUTH_CHECK_TTL_MS = 5 * 60 * 1000;
const FETCH_THROTTLE_MS = 15000;
const AUTH_CHECK_CACHE_KEY = 'notifications-auth-check';
const AUTH_BACKOFF_BASE_MS = 30000;
const AUTH_BACKOFF_MAX_MS = 10 * 60 * 1000;

const logDev = (...args: Parameters<typeof console.log>) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: string;
  read: boolean;
  actionUrl?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => void;
}

interface NotificationsProviderProps {
  children: ReactNode;
}

const NotificationsContext = createContext<UseNotificationsReturn | null>(null);

function useNotificationsState(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const reconnectDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const retryCountRef = useRef(0);
  const isUnmountedRef = useRef(false);
  const hasAuthenticatedRef = useRef(false);
  const lastAuthCheckRef = useRef<{ timestamp: number; result: boolean }>({
    timestamp: 0,
    result: false
  });
  const authBackoffRef = useRef<{ delayMs: number; until: number }>({
    delayMs: AUTH_BACKOFF_BASE_MS,
    until: 0
  });
  const authCheckPromiseRef = useRef<Promise<boolean> | null>(null);
  const lastFetchRef = useRef(0);

  const getCachedAuthCheck = useCallback(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const raw = window.localStorage.getItem(AUTH_CHECK_CACHE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as {
        timestamp?: number;
        result?: boolean;
      };

      if (
        typeof parsed.timestamp === 'number' &&
        typeof parsed.result === 'boolean'
      ) {
        return parsed as { timestamp: number; result: boolean };
      }
    } catch (error) {
      console.warn('useNotifications: falha ao ler cache de auth', error);
    }

    return null;
  }, []);

  const setCachedAuthCheck = useCallback(
    (payload: { timestamp: number; result: boolean }) => {
      if (typeof window === 'undefined') {
        return;
      }

      try {
        window.localStorage.setItem(AUTH_CHECK_CACHE_KEY, JSON.stringify(payload));
      } catch (error) {
        console.warn('useNotifications: falha ao salvar cache de auth', error);
      }
    },
    []
  );

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const closeEventSource = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('useNotifications SSE: closing existing connection');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    clearReconnectTimeout();
    if (reconnectDebounceRef.current) {
      clearTimeout(reconnectDebounceRef.current);
      reconnectDebounceRef.current = null;
    }
  }, [clearReconnectTimeout]);

  // Função para verificar se está autenticado
  const isAuthenticated = useCallback(async (): Promise<boolean> => {
    const now = Date.now();
    const { timestamp, result } = lastAuthCheckRef.current;

    if (authBackoffRef.current.until && now < authBackoffRef.current.until) {
      return result;
    }

    if (now - timestamp < AUTH_CHECK_TTL_MS) {
      return result;
    }

    const cachedAuth = getCachedAuthCheck();
    if (cachedAuth && now - cachedAuth.timestamp < AUTH_CHECK_TTL_MS) {
      lastAuthCheckRef.current = cachedAuth;
      return cachedAuth.result;
    }

    if (authCheckPromiseRef.current) {
      return authCheckPromiseRef.current;
    }

    const promise = fetch('/api/auth/check', {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    })
      .then(async response => {
        if (response.status === 429) {
          const retryAfterHeader = response.headers.get('Retry-After');
          const retryAfterMs = retryAfterHeader
            ? Number.parseInt(retryAfterHeader, 10) * 1000
            : 0;

          const computedDelay = Math.min(
            AUTH_BACKOFF_MAX_MS,
            Math.max(retryAfterMs || 0, authBackoffRef.current.delayMs)
          );

          const until = Date.now() + computedDelay;

          authBackoffRef.current = {
            delayMs: Math.min(
              AUTH_BACKOFF_MAX_MS,
              Math.max(AUTH_BACKOFF_BASE_MS, computedDelay * 2)
            ),
            until
          };

          const cached = {
            timestamp: Date.now(),
            result: lastAuthCheckRef.current.result
          };

          lastAuthCheckRef.current = cached;
          setCachedAuthCheck(cached);
          return cached.result;
        }

        const authenticated = response.ok;

        const payload = { timestamp: Date.now(), result: authenticated };
        lastAuthCheckRef.current = payload;
        setCachedAuthCheck(payload);
        authBackoffRef.current = { delayMs: AUTH_BACKOFF_BASE_MS, until: 0 };

        return authenticated;
      })
      .catch(() => false)
      .finally(() => {
        authCheckPromiseRef.current = null;
      });

    authCheckPromiseRef.current = promise;
    return promise;
  }, [getCachedAuthCheck, setCachedAuthCheck]);

  // Função para limpar estado quando não autenticado
  const clearState = useCallback(() => {
    closeEventSource();
    setNotifications([]);
    setUnreadCount(0);
    setError(null);
    setLoading(false);
    hasAuthenticatedRef.current = false;
    lastAuthCheckRef.current = { timestamp: Date.now(), result: false };
    authCheckPromiseRef.current = null;
  }, [closeEventSource]);

  const getAuthHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json'
    };
  }, []);

  const fetchNotifications = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchRef.current < FETCH_THROTTLE_MS) {
      return;
    }

    const authenticated = await isAuthenticated();
    if (!authenticated) {
      logDev('useNotifications: Usuário não autenticado, limpando estado');
      clearState();
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const headers = getAuthHeaders();
      const response = await fetch('/api/notifications', {
        credentials: 'include',
        headers
      });

      if (!response.ok) {
        // Tratar diferentes tipos de erro
        if (response.status === 401 || response.status === 404) {
          logDev('useNotifications: Auth inválida, limpando estado');
          clearState();
          return;
        }
        throw new Error(`HTTP ${response.status}: Failed to fetch notifications`);
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      lastFetchRef.current = Date.now();
      
      logDev('useNotifications: Dados carregados', {
        total: data.notifications?.length || 0,
        unread: data.unreadCount || 0
      });

    } catch (err) {
      console.error('useNotifications: Error fetching notifications:', err);
      
      // Se erro de auth, limpar estado completamente
      if (err instanceof Error && err.message.includes('Authentication required')) {
        clearState();
        return;
      }
      
      // Para outros erros, manter dados mas mostrar erro
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      lastFetchRef.current = Date.now();
      setLoading(false);
    }
  }, [getAuthHeaders, isAuthenticated, clearState]);

  const connectEventSource = useCallback(async () => {
    if (typeof window === 'undefined') {
      return;
    }

    if (isUnmountedRef.current) {
      return;
    }

    const authenticated = await isAuthenticated();
    if (!authenticated) {
      console.log('useNotifications SSE: usuário não autenticado, não conectando');
      closeEventSource();
      return;
    }

    if (typeof EventSource === 'undefined') {
      console.warn('useNotifications SSE: EventSource não suportado, mantendo dados existentes');
      return;
    }

    if (eventSourceRef.current) {
      return;
    }

    console.log('useNotifications SSE: conectando ao stream');

    try {
      const eventSource = new EventSource('/api/notifications/fluxo', {
        withCredentials: true
      });

      eventSourceRef.current = eventSource;

      eventSource.addEventListener('connected', () => {
        console.log('useNotifications SSE: conexão estabelecida');
        retryCountRef.current = 0;
        hasAuthenticatedRef.current = true;
        fetchNotifications();
      });

      eventSource.addEventListener('ping', () => {
        lastFetchRef.current = Date.now();
      });

      eventSource.addEventListener('timeout', () => {
        console.warn('useNotifications SSE: conexão atingiu timeout, reabrindo');
        closeEventSource();
        connectEventSourceDebounced();
      });

      eventSource.addEventListener('unauthorized', () => {
        console.warn('useNotifications SSE: sessão inválida informada pelo servidor');
        clearState();
      });

      eventSource.addEventListener('refresh', (event: MessageEvent<string>) => {
        try {
          const payload: NotificationStreamEvent = JSON.parse(event.data);
          console.log('useNotifications SSE: evento refresh recebido', payload);
        } catch (parseError) {
          console.error('useNotifications SSE: erro ao interpretar evento refresh', parseError);
        } finally {
          fetchNotifications();
        }
      });

      eventSource.onerror = async error => {
        console.error('useNotifications SSE: erro na conexão', error);
        closeEventSource();

        const stillAuthenticated = await isAuthenticated();
        if (!stillAuthenticated) {
          console.log('useNotifications SSE: não autenticado mais, parando reconexões');
          clearState();
          return;
        }

        if (
          !isUnmountedRef.current &&
          !reconnectTimeoutRef.current &&
          retryCountRef.current < MAX_STREAM_RETRIES
        ) {
          retryCountRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            connectEventSource();
          }, STREAM_DEBOUNCE_MS);
        } else if (retryCountRef.current >= MAX_STREAM_RETRIES) {
          console.warn(
            'useNotifications SSE: limite de tentativas atingido, parando reconexões automáticas'
          );
        }
      };
    } catch (connectionError) {
      console.error('useNotifications SSE: falha ao iniciar EventSource', connectionError);
      closeEventSource();
    }
  }, [clearState, closeEventSource, fetchNotifications, isAuthenticated]);

  const connectEventSourceDebounced = useCallback(() => {
    if (reconnectDebounceRef.current) {
      return;
    }

    reconnectDebounceRef.current = setTimeout(() => {
      reconnectDebounceRef.current = null;
      connectEventSource();
    }, STREAM_DEBOUNCE_MS);
  }, [connectEventSource]);

  const markAsRead = useCallback(async (id: string) => {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      clearState();
      return;
    }

    try {
      const headers = getAuthHeaders();
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 404) {
          clearState();
          return;
        }
        throw new Error('Failed to mark notification as read');
      }

      // Atualizar estado local
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      if (err instanceof Error && err.message.includes('Authentication required')) {
        clearState();
      } else {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    }
  }, [getAuthHeaders, isAuthenticated, clearState]);

  const markAllAsRead = useCallback(async () => {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      clearState();
      return;
    }

    try {
      const headers = getAuthHeaders();
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        credentials: 'include',
        headers
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 404) {
          clearState();
          return;
        }
        throw new Error('Failed to mark all notifications as read');
      }

      // Atualizar estado local
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      if (err instanceof Error && err.message.includes('Authentication required')) {
        clearState();
      } else {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    }
  }, [getAuthHeaders, isAuthenticated, clearState]);

  const deleteNotification = useCallback(async (id: string) => {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      clearState();
      return;
    }

    try {
      const headers = getAuthHeaders();
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 404) {
          clearState();
          return;
        }
        throw new Error('Failed to delete notification');
      }

      // Atualizar estado local
      const notificationToDelete = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      
      if (notificationToDelete && !notificationToDelete.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      if (err instanceof Error && err.message.includes('Authentication required')) {
        clearState();
      } else {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    }
  }, [getAuthHeaders, notifications, isAuthenticated, clearState]);

  const refreshNotifications = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ✅ ÚNICO useEffect - gerencia auth E SSE
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    isUnmountedRef.current = false;
    retryCountRef.current = 0;

    const initAuth = async () => {
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        logDev('useNotifications: Não autenticado no mount');
        clearState();
      } else {
        console.log('useNotifications: Autenticado, iniciando SSE');
        hasAuthenticatedRef.current = true;
        connectEventSourceDebounced();
      }
    };

    initAuth();

    return () => {
      isUnmountedRef.current = true;
      closeEventSource();
      clearReconnectTimeout();
      if (reconnectDebounceRef.current) {
        clearTimeout(reconnectDebounceRef.current);
        reconnectDebounceRef.current = null;
      }
    };
  }, [isAuthenticated, clearState, connectEventSourceDebounced, closeEventSource, clearReconnectTimeout]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications
  };
}

export function NotificationsProvider({
  children
}: NotificationsProviderProps): JSX.Element {
  const value = useNotificationsState();

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): UseNotificationsReturn {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }

  return context;
}
