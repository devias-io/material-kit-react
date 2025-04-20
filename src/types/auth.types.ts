import { User } from "./user.types";

export interface AuthResponse {
  data: {
    data: {
      accessToken: string;
      result: User;
    };
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface ResetCredentials {
  email: string;
}

export interface ForgotPasswordCredentials {
  email: string;
  newPassword: string;
  token: string;
}

export interface ChangePasswordCredentials {
  currentPassword: string;
  newPassword: string;
}
