import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/styles';
import { PedidosToolbar, PedidosTable } from './components';
// import axios from 'axios';

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import {
  listar,
  salvar,
  deletar,
  alterarStatus

} from '../../store/pedidosReducer'

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


const PedidoList = (props) => {
  const classes = useStyles()




  useEffect(() => {
    props.listar()
  }, [])

  return (
    <div className={classes.root}>
      <PedidosToolbar salvar={props.salvar} />     {/* ---------  PROPS REDUX --------- */}
      <div className={classes.content}>
        <PedidosTable
          alterarStatus={props.alterarStatus}     //---------  PROPS REDUX ---------
          pedidos={props.pedidos}                 //---------  PROPS REDUX ---------
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
  pedidos: state.pedidos.pedidos,
  mensagem: state.mensagens.mensagem,
  openDialog: state.mensagens.mostrarMensagem
})

const mapDispatchToProps = dispatch =>
  bindActionCreators({
    listar,
    salvar,
    deletar,
    alterarStatus,
    esconderMensagem
  }, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(PedidoList);
