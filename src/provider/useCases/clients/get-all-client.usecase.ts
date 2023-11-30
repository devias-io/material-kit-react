import { MainApiProvider } from "src/provider/MainApiProvider"

const result = new MainApiProvider()

export async function GetAllClientsUseCase(search: string){

    const response = await result.request('GET', `/users?search=${search}`)
    
    return response
}