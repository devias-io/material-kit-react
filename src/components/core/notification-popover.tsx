// src\components\core\notification-popover.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Popover,
  Divider,
  Button,
  Chip,
  Stack,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
  MarkEmailRead as MarkEmailReadIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

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

interface NotificationPopoverProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'success':
      return <CheckCircleIcon sx={{ color: 'success.main' }} />;
    case 'warning':
      return <WarningIcon sx={{ color: 'warning.main' }} />;
    case 'error':
      return <ErrorIcon sx={{ color: 'error.main' }} />;
    default:
      return <InfoIcon sx={{ color: 'info.main' }} />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'success':
      return 'success.light';
    case 'warning':
      return 'warning.light';
    case 'error':
      return 'error.light';
    default:
      return 'info.light';
  }
};

const formatTimeAgo = (date: string) => {
  const now = new Date();
  const notifDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - notifDate.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Agora há pouco';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m atrás`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h atrás`;
  return `${Math.floor(diffInSeconds / 86400)}d atrás`;
};

export function NotificationPopover({ 
  anchorEl, 
  open, 
  onClose, 
  notifications, 
  unreadCount 
}: NotificationPopoverProps) {
  const router = useRouter();
  const [localLoading, setLocalLoading] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);

  const handleNotificationClick = async (notification: Notification) => {
    // Marcar como lida se não estiver lida
    if (!notification.read) {
      try {
        setLocalLoading(true);
        await fetch(`/api/notifications/${notification.id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.error('Erro ao marcar como lida:', error);
        setLocalError('Erro ao marcar como lida');
      } finally {
        setLocalLoading(false);
      }
    }

    // Redirecionar se há URL de ação
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }

    onClose();
  };

  const handleMarkAsRead = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    
    try {
      setLocalLoading(true);
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Recarregar página para atualizar dados
      window.location.reload();
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
      setLocalError('Erro ao marcar como lida');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    
    try {
      setLocalLoading(true);
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Recarregar página para atualizar dados
      window.location.reload();
    } catch (error) {
      console.error('Erro ao deletar:', error);
      setLocalError('Erro ao deletar');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setLocalLoading(true);
      await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Recarregar página para atualizar dados
      window.location.reload();
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      setLocalError('Erro ao marcar todas como lidas');
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <Popover
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      slotProps={{
        paper: {
          sx: {
            width: 400,
            maxHeight: 500,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }
        }
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'grey.100' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600 }}>
            Notificações
            {unreadCount > 0 && (
<Chip 
  label={unreadCount} 
  size="small"
  variant="filled"
  sx={{ 
    ml: 1,
    height: 20,
    fontSize: '11px',
    fontWeight: 600,
    backgroundColor: '#4bf700',
    color: 'black',
    '&:hover': {
      backgroundColor: '#42d800'
    }
  }}
/>
            )}
          </Typography>
          <IconButton 
            size="small" 
            onClick={onClose}
            sx={{
              color: 'text.disabled',
              '&:hover': {
                color: 'text.secondary',
                backgroundColor: 'grey.50'
              }
            }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
        
         {unreadCount > 0 && (
          <Button
            size="small"
            startIcon={<MarkEmailReadIcon sx={{ fontSize: 16 }} />}
            onClick={handleMarkAllAsRead}
            disabled={localLoading}
            sx={{ 
              mt: 1.5,
              textTransform: 'none',
              fontSize: '12px',
              color: 'grey.700',
              '&:hover': {
                backgroundColor: 'grey.100',
                color: 'grey.800'
              }
            }}
          >
            Marcar todas como lidas
          </Button>
        )}
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {localLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {localError && (
          <Box sx={{ p: 2 }}>
            <Alert severity="error">{localError}</Alert>
          </Box>
        )}

        {!localLoading && !localError && notifications.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <InfoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body1" color="text.secondary">
              Nenhuma notificação
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Você está em dia com todas as suas notificações
            </Typography>
          </Box>
        )}

        {!localLoading && !localError && notifications.length > 0 && (
          <List sx={{ p: 0 }}>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  sx={{
                    cursor: notification.actionUrl ? 'pointer' : 'default',
                    backgroundColor: notification.read ? 'transparent' : 'rgba(75, 247, 0, 0.06)',
                    '&:hover': {
                      backgroundColor: 'rgba(75, 247, 0, 0.12)'
                    },
                    borderRadius: 1,
                    mx: 1,
                    my: 0.5,
                    border: !notification.read ? '1px solid rgba(75, 247, 0, 0.3)' : '1px solid transparent',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Box sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      backgroundColor: !notification.read ? '#4bf700' : 'grey.300',
                      transition: 'all 0.2s ease'
                    }} />
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: notification.read ? 400 : 600,
                          fontSize: '14px',
                          lineHeight: 1.4,
                          color: notification.read ? 'text.secondary' : 'text.primary'
                        }}
                      >
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'text.secondary',
                            fontSize: '13px',
                            lineHeight: 1.3,
                            mb: 0.5
                          }}
                        >
                          {notification.message}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'text.disabled',
                            fontSize: '11px',
                            fontWeight: 500
                          }}
                        >
                          {formatTimeAgo(notification.createdAt)}
                        </Typography>
                      </Box>
                    }
                  />

                  <Stack direction="row" spacing={0.5} sx={{ ml: 1 }}>
                    {!notification.read && (
                      <IconButton 
                        size="small" 
                        onClick={(e) => handleMarkAsRead(e, notification.id)}
                        title="Marcar como lida"
                        disabled={localLoading}
                        sx={{
                          width: 28,
                          height: 28,
                          color: 'text.disabled',
                          '&:hover': {
                            color: '#4bf700',
                            backgroundColor: 'rgba(75, 247, 0, 0.1)'
                          }
                        }}
                      >
                        <MarkEmailReadIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    )}
                    
                    <IconButton 
                      size="small" 
                      onClick={(e) => handleDelete(e, notification.id)}
                      title="Deletar"
                      disabled={localLoading}
                      sx={{
                        width: 28,
                        height: 28,
                        color: 'text.disabled',
                        '&:hover': {
                          color: 'error.main',
                          backgroundColor: 'error.50'
                        }
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Stack>
                </ListItem>
                
                {index < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>

      {/* Footer - apenas se há notificações */}
      {notifications.length > 0 && (
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            fullWidth
            variant="text"
            onClick={() => {
              router.push('/dashboard/notifications');
              onClose();
            }}
            sx={{
              color: '#6B7280',
              textTransform: 'none',
              fontSize: '13px',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: 'rgba(75, 247, 0, 0.08)',
                color: '#4bf700'
              }
            }}
          >
            Ver todas as notificações
          </Button>
        </Box>
      )}
    </Popover>
  );
}