export const API_BASE_URL = process.env.NEXT_PUBLIC_XPIPS_API_URL;

export const apiConfig = {
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
};

export const ENDPOINTS = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    reset: "/auth/reset-link",
    forgetPassword: "/auth/forgot-password",
    changePassword: "/auth/change-password",
  },
};
