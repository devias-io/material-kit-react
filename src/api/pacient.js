/* eslint-disable import/prefer-default-export */
import { api } from '.';

export const GetPacients = async (token) => {
  api.defaults.headers['access-token'] = token;
  const response = await api({
    method: 'GET',
    url: '/pacients',
  });
  return response;
};

export const GetPacient = async (token, idPacient) => {
  api.defaults.headers['access-token'] = token;
  const response = await api({
    method: 'GET',
    url: `/pacients/${idPacient}`,
  });
  return response;
};

export const NewPacients = async (token, data) => {
  api.defaults.headers['access-token'] = token;
  const response = await api({
    method: 'POST',
    url: '/pacients',
    data,
  });
  return response;
};

export const RemovePacient = async (token, idPaciente) => {
  api.defaults.headers['access-token'] = token;
  const response = await api({
    method: 'DELETE',
    url: `/pacients/${idPaciente}`,
  });
  return response;
};
