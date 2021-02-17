/* eslint-disable import/prefer-default-export */
import { api } from '.';

export const newProduct = async (token, data) => {
  api.defaults.headers['access-token'] = token;
  const response = await api({
    method: 'POST',
    url: '/products',
    data,
  });
  return response;
};

export const getProducts = async (token) => {
  api.defaults.headers['access-token'] = token;
  const response = await api({
    method: 'GET',
    url: '/products',
  });
  return response;
};
