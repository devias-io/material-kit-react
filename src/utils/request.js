import axios from "axios";
import { API_URL } from "../configs/env";
import { getCookies } from "./cookies";
import { ACCESS_TOKEN_KEY } from "../configs/constants";
import { notify } from "./notification";

const request = axios.create({
  baseURL: API_URL,
});

const token = getCookies(ACCESS_TOKEN_KEY);

if (token) {
  request.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

request.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.message || err.message || "Something went wrong";
    notify(message, "error");
  }
);

export default request;
