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

export const GetVacunasTipos = async (token, tipo) => {
  api.defaults.headers['access-token'] = token;
  const response = await api({
    method: 'GET',
    url: `/vacunas/${tipo}`,
  });
  return response;
};
