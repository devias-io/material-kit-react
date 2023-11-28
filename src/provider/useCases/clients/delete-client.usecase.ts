import { AuthApiProvider } from "../../AuthApiProvider"

const reult = new AuthApiProvider()

export async function DeleteClientUseCase(id: string){

    const response = await reult.request('DELETE', `/clients/${id}`)
    
    return response
}