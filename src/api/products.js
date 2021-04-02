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

export const getProductsByTipo = async (token, tipo) => {
  api.defaults.headers['access-token'] = token;
  const response = await api({
    method: 'GET',
    url: `/products/${tipo}`,
  });
  return response;
};

export const UpdateProduct = async (token, idProduct, data) => {
  api.defaults.headers['access-token'] = token;
  const response = await api({
    method: 'PUT',
    url: `/products/${idProduct}`,
    data,
  });
  return response;
};

export const deleteProduct = async (token, idProduct) => {
  api.defaults.headers['access-token'] = token;
  const response = await api({
    method: 'DELETE',
    url: `/products/${idProduct}`,
  });
  return response;
};
