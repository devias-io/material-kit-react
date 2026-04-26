import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8080/', // Your Spring Boot base URL
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;
