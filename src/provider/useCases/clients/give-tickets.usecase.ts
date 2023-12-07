import { MainApiProvider } from "src/provider/MainApiProvider";

const apiAprovider = new MainApiProvider()

interface IGiveTicketsToClient {
  userId: string
  drawId: string
  amount: number
}
export const GiveTicketsToClientUsecase = async (data: IGiveTicketsToClient) => {
  const response = await apiAprovider.request('POST', `users/give-tickets`, data)

  return response
}
