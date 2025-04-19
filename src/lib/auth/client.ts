'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';

import { paths } from '@/paths';
import { logger } from '@/lib/default-logger';

export interface SignUpParams {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface SignInWithOAuthParams {
  provider: 'google' | 'discord';
}

export interface SignInWithPasswordParams {
  email: string;
  password: string;
}

export interface ResetPasswordParams {
  email: string;
}

export interface UpdateUserParams {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  state?: string;
  city?: string;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

interface AuthResponse {
  accessToken: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
}

const apiConfig = {
  baseURL: process.env.NEXT_PUBLIC_XPIPS_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
};

const axiosInstance = axios.create(apiConfig);

const TOKEN_KEY = 'accessToken';
const COOKIE_OPTIONS = {
  expires: 7, // 7 days
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
};

// Add request interceptor to include token in headers
axiosInstance.interceptors.request.use(
  (config) => {
    const token = Cookies.get(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      logger.debug('[axiosInterceptor]: Token added to request', token.slice(0, 10) + '...');
    } else {
      logger.debug('[axiosInterceptor]: No token found in cookies');
    }
    return config;
  },
  (error) => {
    logger.error('[axiosInterceptor]: Request error', error);
    return Promise.reject(error);
  }
);

const setAuthToken = (token: string) => {
  Cookies.set(TOKEN_KEY, token, COOKIE_OPTIONS);
};

const removeAuthToken = () => {
  Cookies.remove(TOKEN_KEY);
};

const getAuthToken = () => Cookies.get(TOKEN_KEY);

// API service layer
const authService = {
  async signUp(params: SignUpParams) {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>('/auth/register', params);
    return response.data;
  },

  async signInWithPassword(params: SignInWithPasswordParams) {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>('/auth/login', params);
    return response.data;
  },

  async signInWithOAuth(params: SignInWithOAuthParams) {
    throw new Error('Social authentication not implemented');
  },

  async resetPassword(params: ResetPasswordParams) {
    const response = await axiosInstance.post<ApiResponse>('/auth/reset-password', params);
    return response.data;
  },

  async updatePassword(params: ResetPasswordParams) {
    const response = await axiosInstance.post<ApiResponse>('/auth/change-password', params);
    return response.data;
  },

  async getCurrentUser() {
    const token = getAuthToken();
    if (!token) {
      logger.debug('[authService.getCurrentUser]: No token found');
      throw new Error('No authentication token available');
    }
    const response = await axiosInstance.get<ApiResponse<User>>('/user/profile');
    return response.data;
  },

  async updateUser(params: UpdateUserParams) {
    const response = await axiosInstance.patch<ApiResponse<User>>('/user/profile', params);
    return response.data;
  },
};

// React Query hooks
export const useAuth = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const signUpMutation = useMutation({
    mutationFn: authService.signUp,
    onSuccess: (data) => {
      if (data.success && data.data?.accessToken) {
        setAuthToken(data.data.accessToken);
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      }
    },
    onError: (error: AxiosError<ApiResponse>) => {
      return { error: error.response?.data.message || 'Registration failed' };
    },
  });

  const signInMutation = useMutation({
    mutationFn: authService.signInWithPassword,
    onSuccess: (data) => {
      if (data.success && data.data?.accessToken) {
        setAuthToken(data.data.accessToken);
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      }
    },
    onError: (error: AxiosError<ApiResponse>) => {
      return { error: error.response?.data.message || 'Invalid credentials' };
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      removeAuthToken();
      queryClient.clear();
      return { success: true };
    },
    onSuccess: () => {
      router.push(paths.auth.signIn);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: authService.resetPassword,
    onError: (error: AxiosError<ApiResponse>) => {
      return { error: error.response?.data.message || 'Password reset failed' };
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: authService.updatePassword,
    onError: (error: AxiosError<ApiResponse>) => {
      return { error: error.response?.data.message || 'Password update failed' };
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: authService.updateUser,
    onSuccess: (data) => {
      if (data.success && data.data) {
        queryClient.setQueryData(['currentUser'], data);
      }
    },
    onError: (error: AxiosError<ApiResponse>) => {
      return { error: error.response?.data.message || 'Failed to update profile' };
    },
  });

  const currentUserQuery = useQuery({
    queryKey: ['currentUser'],
    queryFn: authService.getCurrentUser,
    enabled: !!getAuthToken(),
    select: (data) => data.data,
  });

  return {
    signUp: signUpMutation.mutateAsync,
    signInWithPassword: signInMutation.mutateAsync,
    signInWithOAuth: authService.signInWithOAuth,
    resetPassword: resetPasswordMutation.mutateAsync,
    updatePassword: updatePasswordMutation.mutateAsync,
    updateUser: updateUserMutation.mutateAsync,
    signOut: signOutMutation.mutateAsync,
    currentUser: currentUserQuery.data,
    isAuthenticated: !!getAuthToken(),
    isLoading: currentUserQuery.isLoading,
  };
};
