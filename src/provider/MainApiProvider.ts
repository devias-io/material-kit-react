import axios from "axios";
import { Result } from "../core/Result";
import { InternalException } from "../core/Exceptions/ExceptionCodes";
import Cookies from "js-cookie";


export class MainApiProvider {
    private readonly url: string;
  
    constructor() {
      this.url = process.env.NEXT_PUBLIC_REALIZZA_BACKEND_PORT;
    }
  
    async request(method: string, url: string, data?: any, token?: string): Promise<Result<any>> {
        if (!data) data = {};
    
        if (!token) token = await Cookies.get('token') || undefined;
  
      
        switch (method) {
            case 'GET':
                return axios.get(`${url}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    baseURL: this.url,
                }).then((res) => {
                    return Result.ok(res.data);
                }).catch((err) => {
                    return Result.fail(err);
                });
            case 'POST':
                return axios.post(`${url}`, data, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    baseURL: this.url,
                }).then((res) => {
                    return Result.ok(res.data);

                } ).catch((err) => {
                    return Result.fail(err);

                });
            case 'PUT':
                return axios.put(`${url}`, data, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,

                    },
                    baseURL: this.url,
                }).then((res) => {
                    return Result.ok(res.data);

                }).catch((err) => {
                    return Result.fail(err);
                });
            case 'DELETE':
                return axios.delete(`${url}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    baseURL: this.url,
                }).then((res) => {
                    return Result.ok(res.data);

                }).catch((err) => {
                    return Result.fail(err);
                });
            default:
                return Result.fail(new InternalException(new Error('Method not found')));
        }
    }

}