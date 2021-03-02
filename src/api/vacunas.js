/* eslint-disable import/prefer-default-export */
import { api } from '.';

export const GetVacunasByTipos = async (token, tipo, idPacient) => {
  api.defaults.headers['access-token'] = token;
  const response = await api({
    method: 'GET',
    url: `/vacunas/${tipo}/${idPacient}`,
  });
  return response;
};

export const GetCalendarVacunas = async (token, idPacient) => {
  api.defaults.headers['access-token'] = token;
  const response = await api({
    method: 'GET',
    url: `/vacunas/mis-calendario/${idPacient}`,
  });
  return response;
};

export const GetCalendario = async (token) => {
  api.defaults.headers['access-token'] = token;
  const response = await api({
    method: 'GET',
    url: '/vacunas/calendario-general',
  });
  return response;
};

export const GetVacunasTipos = async (token, idPacient) => {
  api.defaults.headers['access-token'] = token;
  const response = await api({
    method: 'GET',
    url: `/vacunas/${idPacient}`,
  });
  return response;
};

export const CreateVacunaPacient = async (token, data) => {
  api.defaults.headers['access-token'] = token;
  const response = await api({
    method: 'POST',
    url: '/vacunas',
    data,
  });
  return response;
};

export const DeleteVacunaPacient = async (token, idVacuna) => {
  api.defaults.headers['access-token'] = token;
  const response = await api({
    method: 'DELETE',
    url: `/vacunas/${idVacuna}`,
  });
  return response;
};
