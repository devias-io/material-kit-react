import { combineReducers } from 'redux'
import { tarefaReducer }  from './tarefasReducer';
import { mensagemReducer } from './mensagensReducer'

const mainReducer = combineReducers({   
    tarefas: tarefaReducer,
    mensagens: mensagemReducer
})

export default mainReducer;