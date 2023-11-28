import { MainApiProvider } from "../../MainApiProvider"
import { CreateClientDto } from "../../dtos/clients/create-client.dto"



const reult = new MainApiProvider()

export async function UpdateClientUseCase(id: string, data: CreateClientDto){

    const response = await reult.request('PUT', `/clients/${id}`, data)
    
    return response
}