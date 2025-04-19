'use client';

import type { User } from '@/types/user';

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

interface ApiResponse {
  token?: string;
  message?: string;
  data?: {
    accessToken: string;
  };
  [key: string]: unknown;
}

interface BackendUserResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    avatar?: string;
    [key: string]: unknown;
  };
}

class AuthClient {
  async signUp(params: SignUpParams): Promise<{ error?: string }> {
    try {
      const registerUrl = process.env.NEXT_PUBLIC_XPIPS_REGISTER_URL;
      if (!registerUrl) {
        return { error: 'Register URL not configured' };
      }

      const response = await fetch(registerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data = await response.json() as ApiResponse;

      if (!response.ok) {
        return { error: data.message! || 'Registration failed' };
      }

      if (data.data?.accessToken) {
        localStorage.setItem('custom-auth-token', data.data.accessToken);
      }

      return {};
    } catch (error) {
      // Log error silently in production
      return { error: 'Failed to register' };
    }
  }

  async signInWithOAuth(_: SignInWithOAuthParams): Promise<{ error?: string }> {
    return { error: 'Social authentication not implemented' };
  }

  async signInWithPassword(params: SignInWithPasswordParams): Promise<{ error?: string }> {
    try {
      const loginUrl = process.env.NEXT_PUBLIC_XPIPS_LOGIN_URL;
      if (!loginUrl) {
        return { error: 'Login URL not configured' };
      }

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data = await response.json() as ApiResponse;

      if (!response.ok) {
        return { error: data.message! || 'Invalid credentials' };
      }

      if (data.data?.accessToken) {
        localStorage.setItem('custom-auth-token', data.data.accessToken);
      } else if (data.token) {
        localStorage.setItem('custom-auth-token', data.token);
      }

      return {};
    } catch (error) {
      // Log error silently in production
      return { error: 'Failed to login' };
    }
  }

  async resetPassword(_: ResetPasswordParams): Promise<{ error?: string }> {
    return { error: 'Password reset not implemented' };
  }

  async updatePassword(_: ResetPasswordParams): Promise<{ error?: string }> {
    return { error: 'Update reset not implemented' };
  }

  async getUser(): Promise<{ data?: User | null; error?: string }> {
    try {
      const token = localStorage.getItem('custom-auth-token');

      if (!token) {
        return { data: null };
      }

      const apiUrl = process.env.NEXT_PUBLIC_XPIPS_API_URL;
      if (!apiUrl) {
        return { error: 'API URL not configured' };
      }

      const response = await fetch(`${apiUrl}/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        // If token is invalid or expired, clear it
        if (response.status === 401) {
          localStorage.removeItem('custom-auth-token');
          return { data: null };
        }

        const errorData = await response.json() as { message?: string };
        return { error: errorData.message || 'Failed to get user data' };
      }

      const userData = await response.json() as BackendUserResponse;

      // Convert backend user format to frontend User type
      return {
        data: {
          id: userData.data._id,
          avatar: userData.data.avatar || '/assets/avatar.png',
          firstName: userData.data.firstName,
          lastName: userData.data.lastName,
          email: userData.data.email,
          role: userData.data.role
        }
      };
    } catch (error) {
      // Log error silently in production
      return { error: 'Failed to get user data' };
    }
  }

  async signOut(): Promise<{ error?: string }> {
    localStorage.removeItem('custom-auth-token');

    return {};
  }
}

export const authClient = new AuthClient();
