/* eslint-disable import/prefer-default-export */
import { api } from '.';

export const newSeguimiento = async (token, data) => {
  api.defaults.headers['access-token'] = token;
  const response = await api({
    method: 'POST',
    url: '/seguimiento',
    data,
  });
  return response;
};

export const getSeguimiento = async (token, idPacient) => {
  api.defaults.headers['access-token'] = token;
  const response = await api({
    method: 'GET',
    url: `/seguimiento/${idPacient}`,
  });
  return response;
};

export const deleteSeguimiento = async (token, idSeguimiento) => {
  api.defaults.headers['access-token'] = token;
  const response = await api({
    method: 'DELETE',
    url: `/seguimiento/${idSeguimiento}`,
  });
  return response;
};
