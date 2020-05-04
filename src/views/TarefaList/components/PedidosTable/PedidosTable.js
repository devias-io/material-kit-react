import React, { useState } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import moment from 'moment';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { makeStyles } from '@material-ui/styles';
import TimerIcon from '@material-ui/icons/Timer';
import DoneAllIcon from '@material-ui/icons/DoneAll';
import DeleteIcon from '@material-ui/icons/Delete'
import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  IconButton
} from '@material-ui/core';

import { getInitials } from 'helpers';

const useStyles = makeStyles(theme => ({
  root: {},
  content: {
    padding: 0
  },
  inner: {
    minWidth: 1050
  },
  nameContainer: {
    display: 'flex',
    alignItems: 'center'
  },
  avatar: {
    marginRight: theme.spacing(2)
  },
  actions: {
    justifyContent: 'flex-end'
  }
}));



const PedidosTable = props => {
  const { className, pedidos, ...rest } = props;

  const classes = useStyles();

  return (
    <Card
      {...rest}
      className={clsx(classes.root, className)}
    >
      <CardContent className={classes.content}>
        <PerfectScrollbar>
          <div className={classes.inner}>
            
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Id</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Produto</TableCell>   
                  <TableCell>Status</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>

              </TableHead>

                <TableBody>

                  {
                   pedidos.map( pedido => {

                    return(
                      <TableRow key={pedido.id}>
                        <TableCell>{pedido.id}</TableCell>
                        <TableCell>{pedido.cliente}</TableCell>
                        <TableCell>{pedido.produto}</TableCell>
                        <TableCell>{pedido.done ? "Entregue" : "Não entregue"}</TableCell>
                        <TableCell>
                          <IconButton onClick={e => props.alterarStatus(pedido.id)} color="secondary">
                            {
                              pedido.done ? ( <DoneAllIcon/> ) : ( <TimerIcon/> )
                            }
                          </IconButton>
                        </TableCell>

                        <TableCell>
                          <IconButton onClick={e => props.deleteAction(pedido.id)}>
                              <DeleteIcon/>
                          </IconButton>
                        </TableCell>

                      </TableRow>
                    )
                     })
                  }
                  
                </TableBody>
            </Table>

          </div>
        </PerfectScrollbar>
      </CardContent>
     
    </Card>
  );
};

PedidosTable.propTypes = {
  className: PropTypes.string,
  pedidos: PropTypes.array.isRequired
};

export default PedidosTable;
