import Cookies from "js-cookie";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "../configs/constants";

export const setCookie = (name, value, options = {}) => {
  Cookies.set(name, value, options);
};

export const getCookies = (name) => {
  return Cookies.get(name);
};

export const clearCookies = () => {
  Cookies.remove(ACCESS_TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
};
