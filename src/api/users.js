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

export const GetUserByPacient = async (token, idPacient) => {
  api.defaults.headers['access-token'] = token;
  const response = await api({
    method: 'GET',
    url: `/users/byPacient/${idPacient}`,
  });
  return response;
};

export const UpdateMeUser = async (token, data) => {
  api.defaults.headers['access-token'] = token;
  const response = await api({
    method: 'PUT',
    url: '/users/me',
    data,
  });
  return response;
};

export const DeleteUser = async (token, idUser) => {
  api.defaults.headers['access-token'] = token;
  const response = await api({
    method: 'DELETE',
    url: `/users/${idUser}`,
  });
  return response;
};
