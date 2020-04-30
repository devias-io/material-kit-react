import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/styles';
import { TarefasToolbar, TarefasTable } from './components';
// import axios from 'axios';

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import {
  listar,
  salvar,
  deletar,
  alterarStatus

} from '../../store/tarefasReducer'

import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button
} from '@material-ui/core'

import {
  esconderMensagem
} from '../../store/mensagensReducer'




const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3)
  },
  content: {
    marginTop: theme.spacing(2)
  }
}));




// const API_URL = 'https://minhastarefas-api.herokuapp.com/tarefas'


const TarefaList = (props) => {
  const classes = useStyles()

  // const [tarefas, setTarefas] = useState([])
  // const [openDialog, setOpenDialog] = useState(false)
  // const [mensagem, setMensagem] = useState("")




  // const salvar = (tarefa) => {
  //   axios.post(API_URL, tarefa, {
  //     headers: {'x-tenant-id' : localStorage.getItem('email_usuario_logado')} 
  //   }).then( response => {
  //     const novaTarefa = response.data
  //     setTarefas( [...tarefas, novaTarefa] )
  //     setMensagem("Tarefa adicionada com sucesso")
  //     setOpenDialog(true)
  //   }).catch(erro =>{
  //     setMensagem("Ocorreu um erro")
  //     setOpenDialog(true)
  //   })
  // }




  // const listarTarefas = () => {
  //   axios.get(API_URL, {
  //     headers: { 'x-tenant-id': localStorage.getItem('email_usuario_logado') }
  //   }).then(response => {
  //     const listaDeTarefas = response.data
  //     console.log(listaDeTarefas)
  //     setTarefas(listaDeTarefas)
  //   }).catch(erro => {
  //     setMensagem("Erro ao listar. Tente novamente!")
  //     setOpenDialog(true)
  //   })
  // }




  // const alterarStatus = (id) => {
  //   axios.patch(`${API_URL}/${id}`, null, {
  //     headers: { 'x-tenant-id': localStorage.getItem('email_usuario_logado') }
  //   }).then(response => {
  //     const lista = [...tarefas]
  //     lista.forEach(tarefa => {
  //       if (tarefa.id === id) {
  //         tarefa.done = true;
  //       }
  //     })
  //     setTarefas(lista);
  //     setMensagem("Status atualizado com sucesso!")
  //     setOpenDialog(true)
  //   }).catch(erro => {
  //     setMensagem("Ocorreu um erro ao mudar o status da tarefa. Tente novamente!")
  //     setOpenDialog(true)
  //   })
  // }



  // const deletar = (id) => {
  //   axios.delete(`${API_URL}/${id}`, {
  //     headers: { 'x-tenant-id': localStorage.getItem('email_usuario_logado') }
  //   })
  //     .then(response => {
  //       const lista = tarefas.filter(tarefa => tarefa.id !== id)
  //       setTarefas(lista)
  //       setMensagem("Tarefa deletada com sucesso!")
  //       setOpenDialog(true)
  //     }).catch(erro => {
  //       setMensagem("Erro ao deletar a tarefa. Tente novamente!")
  //     })
  // }


  useEffect(() => {
    props.listar()
  }, [])

  return (
    <div className={classes.root}>
      <TarefasToolbar salvar={props.salvar} />     {/* ---------  PROPS REDUX --------- */}
      <div className={classes.content}>
        <TarefasTable
          alterarStatus={props.alterarStatus}     //---------  PROPS REDUX ---------
          tarefas={props.tarefas}                 //---------  PROPS REDUX ---------
          deleteAction={props.deletar}            //---------  PROPS REDUX ---------
        />
      </div>
      <Dialog open={props.openDialog} onClose={props.esconderMensagem}> 
        <DialogTitle>Atenção</DialogTitle>
        <DialogContent>
          {props.mensagem}
        </DialogContent>
        <DialogActions>
          <Button onClick={props.esconderMensagem}>FECHAR</Button>

        </DialogActions>
      </Dialog>
    </div>
  );
};

const mapStateToProps = state => ({
  tarefas: state.tarefas.tarefas,
  mensagem: state.mensagens.mensagem,
  openDialog: state.mensagens.mostrarMensagem
})

const mapDispatchToDrops = dispatch =>
  bindActionCreators({
    listar,
    salvar,
    deletar,
    alterarStatus,
    esconderMensagem
  }, dispatch)

export default connect(mapStateToProps, mapDispatchToDrops)(TarefaList);
