import axios from "axios";
import { apiConfig } from "./config";
import Cookies from "js-cookie";

const apiClient = axios.create(apiConfig);

// Add a request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
