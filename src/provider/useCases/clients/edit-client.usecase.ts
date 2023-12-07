import { MainApiProvider } from "src/provider/MainApiProvider";

const apiAprovider = new MainApiProvider()

export const EditClientUsecase = async (id, data) => {
  const response = await apiAprovider.request('PATCH', `/users/${id}`, data)

  return response
}