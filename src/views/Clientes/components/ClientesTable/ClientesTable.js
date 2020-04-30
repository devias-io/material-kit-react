import React, { useState } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import moment from 'moment';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { makeStyles } from '@material-ui/styles';
import {
  Card,
  CardActions,
  CardContent,
  Avatar,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  TablePagination
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

const ClientesTable = props => {
  const { className, clientes, ...rest } = props;

  const classes = useStyles();

  const [selectedClientes, setSelectedClientes] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);

  const handleSelectAll = event => {
    const { clientes } = props;

    let selectedClientes;

    if (event.target.checked) {
      selectedClientes = clientes.map(cliente => cliente.id);
    } else {
      selectedClientes = [];
    }

    setSelectedClientes(selectedClientes);
  };

  const handleSelectOne = (event, id) => {
    const selectedIndex = selectedClientes.indexOf(id);
    let newSelectedClientes = [];

    if (selectedIndex === -1) {
      newSelectedClientes = newSelectedClientes.concat(selectedClientes, id);
    } else if (selectedIndex === 0) {
      newSelectedClientes = newSelectedClientes.concat(selectedClientes.slice(1));
    } else if (selectedIndex === selectedClientes.length - 1) {
      newSelectedClientes = newSelectedClientes.concat(selectedClientes.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelectedClientes = newSelectedClientes.concat(
        selectedClientes.slice(0, selectedIndex),
        selectedClientes.slice(selectedIndex + 1)
      );
    }

    setSelectedClientes(newSelectedClientes);
  };

  const handlePageChange = (event, page) => {
    setPage(page);
  };

  const handleRowsPerPageChange = event => {
    setRowsPerPage(event.target.value);
  };

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
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedClientes.length === clientes.length}
                      color="primary"
                      indeterminate={
                        selectedClientes.length > 0 &&
                        selectedClientes.length < clientes.length
                      }
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Nome</TableCell>
                  <TableCell>E-mail</TableCell>
                  <TableCell>Localização</TableCell>
                  <TableCell>Telefone</TableCell>
                  <TableCell>Data de regristro</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clientes.slice(0, rowsPerPage).map(cliente => (
                  <TableRow
                    className={classes.tableRow}
                    hover
                    key={cliente.id}
                    selected={selectedClientes.indexOf(cliente.id) !== -1}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedClientes.indexOf(cliente.id) !== -1}
                        color="primary"
                        onChange={event => handleSelectOne(event, cliente.id)}
                        value="true"
                      />
                    </TableCell>
                    <TableCell>
                      <div className={classes.nameContainer}>
                        <Avatar
                          className={classes.avatar}
                          src={cliente.avatarUrl}
                        >
                          {getInitials(cliente.name)}
                        </Avatar>
                        <Typography variant="body1">{cliente.name}</Typography>
                      </div>
                    </TableCell>
                    <TableCell>{cliente.email}</TableCell>
                    <TableCell>
                      {cliente.address.city}, {cliente.address.state},{' '}
                      {cliente.address.country}
                    </TableCell>
                    <TableCell>{cliente.phone}</TableCell>
                    <TableCell>
                      {moment(cliente.createdAt).format('DD/MM/YYYY')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </PerfectScrollbar>
      </CardContent>
      <CardActions className={classes.actions}>
        <TablePagination
          component="div"
          count={clientes.length}
          onChangePage={handlePageChange}
          onChangeRowsPerPage={handleRowsPerPageChange}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </CardActions>
    </Card>
  );
};

ClientesTable.propTypes = {
  className: PropTypes.string,
  clientes: PropTypes.array.isRequired
};

export default ClientesTable;
