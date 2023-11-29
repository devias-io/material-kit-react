import { MainApiProvider } from "src/provider/MainApiProvider"
import { LoginDTO } from "src/provider/dtos/auth/login.dto"

const result = new MainApiProvider()

export async function SignInUseCase(data: LoginDTO){

    const response = await result.request('POST', '/auth/login', data)
    
    return {
        token: response.value.access_token,
        response
    }
}