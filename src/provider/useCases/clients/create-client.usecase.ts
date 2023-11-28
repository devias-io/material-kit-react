
import { MainApiProvider } from "../../MainApiProvider"
import { CreateClientDto } from "../../dtos/clients/create-client.dto"



const reult = new MainApiProvider()

export async function CreateClientUseCase(data: CreateClientDto){

    const response = await reult.request('POST', '/clients', data)
    
    return response
}