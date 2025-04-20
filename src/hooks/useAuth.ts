import apiClient from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/config";
import {
  AuthResponse,
  ChangePasswordCredentials,
  ForgotPasswordCredentials,
  LoginCredentials,
  RegisterCredentials,
  ResetCredentials,
} from "@/types/auth.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export const useAuth = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const setAuthData = (data: AuthResponse) => {
    const { accessToken, result } = data.data.data;
    console.log(accessToken, result, data);
    Cookies.set("accessToken", accessToken, { expires: 7 });
    Cookies.set("role", result.role, { expires: 7 });
    queryClient.setQueryData(["user"], result);
    router.push("/dashboard");
  };

  const login = useMutation<AuthResponse, Error, LoginCredentials>({
    mutationFn: (credentials) =>
      apiClient.post(ENDPOINTS.auth.login, credentials),
    onSuccess: setAuthData,
    onError: (error) => console.error("Login failed:", error.message),
  });

  const register = useMutation<AuthResponse, Error, RegisterCredentials>({
    mutationFn: (credentials) =>
      apiClient.post(ENDPOINTS.auth.register, credentials),
    onSuccess: setAuthData,
    onError: (error) => console.error("Registration failed:", error.message),
  });

  const logout = useMutation<void, Error>({
    mutationFn: async () => {
      Cookies.remove("accessToken");
      Cookies.remove("role");
    },
    onSuccess: () => {
      queryClient.clear();
      router.push("/auth/login");
    },
    onError: (error) => console.error("Logout failed:", error.message),
  });

  const reset = useMutation<void, Error, ResetCredentials>({
    mutationFn: (credentials) =>
      apiClient.post(ENDPOINTS.auth.reset, credentials),
    onError: (error) => console.error("Password reset failed:", error.message),
  });

  const forgotPassword = useMutation<void, Error, ForgotPasswordCredentials>({
    mutationFn: (credentials) =>
      apiClient.post(ENDPOINTS.auth.forgetPassword, credentials),
    onError: (error) => console.error("Forgot password failed:", error.message),
  });

  const changePassword = useMutation<void, Error, ChangePasswordCredentials>({
    mutationFn: (credentials) =>
      apiClient.post(ENDPOINTS.auth.changePassword, credentials),
    onError: (error) => console.error("Change password failed:", error.message),
  });

  return {
    login: login.mutateAsync,
    register: register.mutateAsync,
    logout: logout.mutateAsync,
    reset: reset.mutateAsync,
    forgotPassword: forgotPassword.mutateAsync,
    changePassword: changePassword.mutateAsync,
  };
};
