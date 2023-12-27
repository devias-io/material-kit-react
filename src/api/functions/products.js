import api from "../http-service";

export const getAllProducts = () =>
  api.get(`products`);

export const createProduct = (data) =>
  api.post(`products`, data);
