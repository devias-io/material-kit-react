
const ESTADO_INICIAL = {
    mensagem: '',
    mostrarMensagem: false
}

export const ACTIONS = {

    MOSTRAR_MENSAGEM: 'MENSAGENS_MOSTRAR',
    ESCONDER_MENSAGEM: 'MENSAGENS_ESCONDER'

}

export function mensagemReducer (state = ESTADO_INICIAL, action){

    switch(action.type){
        case ACTIONS.MOSTRAR_MENSAGEM: 
            return {...state, mensagem: action.mensagem, mostrarMensagem: true}
        case ACTIONS.ESCONDER_MENSAGEM:
            return {...state, mensagem:'', mostrarMensagem: false}
        default:
            return state;
    }
}

export function mostrarMensagem(mensagem){
    return {
        type: ACTIONS.MOSTRAR_MENSAGEM,
        mensagem: mensagem
    }
}

export function esconderMensagem(mensagem){
    return{
        type:ACTIONS.ESCONDER_MENSAGEM,
    }
}