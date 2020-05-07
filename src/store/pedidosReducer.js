import axios from 'axios'
import { mostrarMensagem } from './mensagensReducer'


const http = axios.create({
    baseURL: 'https://minhastarefas-api.herokuapp.com'
})


const ACTIONS = {
    LISTAR: 'PEDIDOS_LISTAR',
    ADD: 'PEDIDOS_ADD',
    REMOVER: 'PEDIDOS_REMOVE',
    UPDATE_STATUS: 'PEDIDOS_UPDATE_STATUS'


}

const ESTADO_INICIAL = {
    pedidos: []
}

export const pedidoReducer = (state = ESTADO_INICIAL, action) => {
    switch (action.type) {
        case ACTIONS.LISTAR:
            return { ...state, pedidos: action.pedidos }

        case ACTIONS.ADD:
            return { ...state, pedidos: [...state.pedidos, action.pedido] }

        case ACTIONS.REMOVER:
            const id = action.id
            const pedidos = state.pedidos.filter( pedido => pedido.id !== id)
            return {...state, pedidos: pedidos}

        case ACTIONS.UPDATE_STATUS:
            const lista = [...state.pedidos]
            lista.forEach( pedido =>{
                if(pedido.id === action.id){
                    pedido.done = true
                }
            })
            return {...state, pedidos: lista}

        default:
            return state;

    }

}

export function listar() {
    return dispatch => {

        http.get('/pedidos', {
            headers: { 'x-tenant-id': localStorage.getItem('email') }
        }).then(response => {
            dispatch({
                type: ACTIONS.LISTAR,
                pedidos: response.data
            })
        })

    }

}

export function salvar(pedido) {
    return dispatch => {
        http.post('/pedidos', pedido, {
            headers: { 'x-tenant-id': localStorage.getItem('email') }
        }).then(response => {
            dispatch
            (
                [{
                type: ACTIONS.ADD,
                pedido: response.data
            }, mostrarMensagem('Pedido adicionada com sucesso!')]

            )
        })
    }
}

export function deletar(id) {
    return disaptch => {
        http.delete(`/pedidos/${id}`, {
            headers: { 'x-tenant-id': localStorage.getItem('email') }
        }).then(response => {
            disaptch([{
                type: ACTIONS.REMOVER,
                id: id
            }, mostrarMensagem('Pedido deletada com sucesso!')])
        })
    }
}

export function alterarStatus( id ){
    return dispatch => {
        http.patch(`pedidos/${id}`, null, {
            headers: { 'x-tenant-id': localStorage.getItem('email') }
          }).then( response => {
              dispatch([{
                  type: ACTIONS.UPDATE_STATUS, 
                  id: id
              }, mostrarMensagem('Status atualizado com sucesso!')])
          })
    }
}