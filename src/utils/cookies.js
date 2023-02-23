import Cookies from "js-cookie";

export const setCookie = (name, value, options = {}) => {
  Cookies.set(name, value, options);
};

export const getCookies = (name) => {
  return Cookies.get(name);
};
