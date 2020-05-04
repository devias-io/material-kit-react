import { combineReducers } from 'redux'
import { pedidoReducer }  from './pedidosReducer';
import { mensagemReducer } from './mensagensReducer'

const mainReducer = combineReducers({   
    pedidos: pedidoReducer,
    mensagens: mensagemReducer
})

export default mainReducer;