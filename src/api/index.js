import * as axios from 'axios';

export const DEFAULT_AVATAR = 'avatar-default.svg';
const apiDev = 'http://localhost:9000';
// const apiProd = 'https://veterinario-yexon.herokuapp.com';

export const BASE_API = apiDev;

export const api = axios.default.create({
  baseURL: `${BASE_API}/api`,
});
