import api from "../http-service";

export const Login = (userData) => api.post("auth/login", userData);
export const Signup = (userData) => api.post("auth/signup", userData);
