import axios from "axios";
import { getToken } from "./auth";

const api = axios.create({
  baseURL: "https://wp-for.i9colab.com/wp-json/jwt-auth/v1/token"
});

api.interceptors.request.use(async config => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;