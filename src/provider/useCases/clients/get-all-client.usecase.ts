import { MainApiProvider } from "src/provider/MainApiProvider"

const result = new MainApiProvider()

export async function GetAllClientsUseCase(search: string, page: number, limit: number){

    const response = await result.request('GET', `/users?search=${search}&limit=${limit}&page=${page}`)
    
    return response
}