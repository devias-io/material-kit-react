import { AuthApiProvider } from "../../AuthApiProvider"


const reult = new AuthApiProvider()

export async function GetClientByIdUseCase(id: string){

    const response = await reult.request('GET', `/clients/${id}`)
    
    return response
}