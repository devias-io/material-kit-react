import { AuthApiProvider } from "../../AuthApiProvider"


const reult = new AuthApiProvider()

export async function GetAllClientsUseCase(){

    const response = await reult.request('GET', '/clients')
    
    return response
}