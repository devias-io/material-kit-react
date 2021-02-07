/* eslint-disable import/prefer-default-export */
import { api } from '.';

export const LoginUser = async (data) => {
//  api.defaults.headers['access-token'] = token;
  const response = await api({
    method: 'POST',
    url: '/users/login',
    data,
  });
  return response;
};

export const NewUser = async (token, data) => {
  api.defaults.headers['access-token'] = token;
  const response = await api({
    method: 'POST',
    url: '/users',
    data,
  });
  return response;
};

export const GetMeUser = async (token) => {
  api.defaults.headers['access-token'] = token;
  const response = await api({
    method: 'GET',
    url: '/users/me',
  });
  return response;
};

export const GetUsers = async (token) => {
  api.defaults.headers['access-token'] = token;
  const response = await api({
    method: 'GET',
    url: '/users',
  });
  return response;
};
