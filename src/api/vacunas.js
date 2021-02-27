/* eslint-disable import/prefer-default-export */
import { api } from '.';

export const GetVacunasByTipos = async (token, tipo) => {
  api.defaults.headers['access-token'] = token;
  const response = await api({
    method: 'GET',
    url: `/vacunas/${tipo}`,
  });
  return response;
};
