import { MainApiProvider } from "src/provider/MainApiProvider";

const apiAprovider = new MainApiProvider()

export const GetAllDrawsUsecase = async () => {
  const response = await apiAprovider.request('GET', `/draws`)
  if (response.isFailure) return { error: response.error.message }

  return response.value
}