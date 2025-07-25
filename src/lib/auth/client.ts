'use client';

import type { User } from '@/types/user';

function generateToken(): string {
  const arr = new Uint8Array(12);
  globalThis.crypto.getRandomValues(arr);
  return Array.from(arr, (v) => v.toString(16).padStart(2, '0')).join('');
}

const user = {
  id: 'USR-000',
  avatar: '/assets/avatar.png',
  firstName: 'Anupama',
  lastName: 'Rivers',
  email: 'anupama@gmail.com',
} satisfies User;

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

class AuthClient {
  async signUp(_: SignUpParams): Promise<{ error?: string }> {
    // Make API request

    // We do not handle the API, so we'll just generate a token and store it in localStorage.
    const token = generateToken();
    localStorage.setItem('custom-auth-token', token);

    return {};
  }

  async signInWithOAuth(_: SignInWithOAuthParams): Promise<{ error?: string }> {
    return { error: 'Social authentication not implemented' };
  }

  // async signInWithPassword(params: SignInWithPasswordParams): Promise<{ error?: string }> {
  //   const { email, password } = params;

  //   // Make API request

  //   // We do not handle the API, so we'll check if the credentials match with the hardcoded ones.
  //   if (email !== 'anupama@gmail.com' || password !== 'Secret1') {
  //     return { error: 'Invalid credentials' };
  //   }

  //   const token = generateToken();
  //   localStorage.setItem('custom-auth-token', token);

  //   return {};
  // }

async signInWithPassword(params: SignInWithPasswordParams): Promise<{ error?: string }> {
  try {
    const res = await fetch('/api/mock-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error || 'Invalid login' };
    }

    localStorage.setItem('custom-auth-token', data.token);
    localStorage.setItem('custom-auth-user', JSON.stringify(data.user));

    return {};
  } catch (err) {
    return { error: 'Network error' };
  }
}



  async resetPassword(_: ResetPasswordParams): Promise<{ error?: string }> {
    return { error: 'Password reset not implemented' };
  }

  async updatePassword(_: ResetPasswordParams): Promise<{ error?: string }> {
    return { error: 'Update reset not implemented' };
  }

  async getUser(): Promise<{ data?: User | null; error?: string }> {
    // Make API request

    // We do not handle the API, so just check if we have a token in localStorage.
    const token = localStorage.getItem('custom-auth-token');

    if (!token) {
      return { data: null };
    }

    return { data: user };
  }

  async signOut(): Promise<{ error?: string }> {
    localStorage.removeItem('custom-auth-token');

    return {};
  }
}

export const authClient = new AuthClient();
