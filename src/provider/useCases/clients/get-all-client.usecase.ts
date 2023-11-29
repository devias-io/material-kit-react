import { MainApiProvider } from "src/provider/MainApiProvider"

const result = new MainApiProvider()

export async function GetAllClientsUseCase(){

    const response = await result.request('GET', '/users')
    
    return response
}