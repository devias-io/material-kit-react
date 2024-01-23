import { MainApiProvider } from "src/provider/MainApiProvider";

const apiAprovider = new MainApiProvider()

export const EditDrawsUsecase = async (data) => {
  const response = await apiAprovider.request('PATCH', `/draws/price`, data)

  return response
}