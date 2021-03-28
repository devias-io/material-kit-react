/* eslint-disable import/prefer-default-export */
import { api } from '.';

export const GetCitas = async (token) => {
  api.defaults.headers['access-token'] = token;
  const response = await api({
    method: 'GET',
    url: '/citas',
  });
  return response;
};

export const GetCalendarCitas = async (token) => {
  api.defaults.headers['access-token'] = token;
  const response = await api({
    method: 'GET',
    url: '/citas/calendar',
  });
  return response;
};

export const NewCita = async (token, data) => {
  api.defaults.headers['access-token'] = token;
  const response = await api({
    method: 'POST',
    url: '/citas',
    data,
  });
  return response;
};

export const UpdateAsistirCita = async (token, status, idSolocitud) => {
  api.defaults.headers['access-token'] = token;
  const response = await api({
    method: 'PUT',
    url: `/citas/asistir/${idSolocitud}`,
    data: {
      status,
    },
  });
  return response;
};

export const DeleteCita = async (token, idSolocitud) => {
  api.defaults.headers['access-token'] = token;
  const response = await api({
    method: 'DELETE',
    url: `/citas/${idSolocitud}`,
  });
  return response;
};
