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

const FornecedoresTable = props => {
  const { className, fornecedores, ...rest } = props;

  const classes = useStyles();

  const [selectedFornecedores, setSelectedFornecedores] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);

  const handleSelectAll = event => {
    const { fornecedores } = props;

    let selectedFornecedores;

    if (event.target.checked) {
      selectedFornecedores = fornecedores.map(fornecedor => fornecedor.id);
    } else {
      selectedFornecedores = [];
    }

    setSelectedFornecedores(selectedFornecedores);
  };

  const handleSelectOne = (event, id) => {
    const selectedIndex = selectedFornecedores.indexOf(id);
    let newSelectedFornecedores = [];

    if (selectedIndex === -1) {
      newSelectedFornecedores = newSelectedFornecedores.concat(selectedFornecedores, id);
    } else if (selectedIndex === 0) {
      newSelectedFornecedores = newSelectedFornecedores.concat(selectedFornecedores.slice(1));
    } else if (selectedIndex === selectedFornecedores.length - 1) {
      newSelectedFornecedores = newSelectedFornecedores.concat(selectedFornecedores.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelectedFornecedores = newSelectedFornecedores.concat(
        selectedFornecedores.slice(0, selectedIndex),
        selectedFornecedores.slice(selectedIndex + 1)
      );
    }

    setSelectedFornecedores(newSelectedFornecedores);
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
                      checked={selectedFornecedores.length === fornecedores.length}
                      color="primary"
                      indeterminate={
                        selectedFornecedores.length > 0 &&
                        selectedFornecedores.length < fornecedores.length
                      }
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Nome</TableCell>
                  <TableCell>E-mail</TableCell>
                  <TableCell>Localização</TableCell>
                  <TableCell>Telefone</TableCell>
                  <TableCell>Data de cadastro</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fornecedores.slice(0, rowsPerPage).map(fornecedor => (
                  <TableRow
                    className={classes.tableRow}
                    hover
                    key={fornecedor.id}
                    selected={selectedFornecedores.indexOf(fornecedor.id) !== -1}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedFornecedores.indexOf(fornecedor.id) !== -1}
                        color="primary"
                        onChange={event => handleSelectOne(event, fornecedor.id)}
                        value="true"
                      />
                    </TableCell>
                    <TableCell>
                      <div className={classes.nameContainer}>
                        <Avatar
                          className={classes.avatar}
                          src={fornecedor.avatarUrl}
                        >
                          {getInitials(fornecedor.name)}
                        </Avatar>
                        <Typography variant="body1">{fornecedor.name}</Typography>
                      </div>
                    </TableCell>
                    <TableCell>{fornecedor.email}</TableCell>
                    <TableCell>
                      {fornecedor.address.city}, {fornecedor.address.state},{' '}
                      {fornecedor.address.country}
                    </TableCell>
                    <TableCell>{fornecedor.phone}</TableCell>
                    <TableCell>
                      {moment(fornecedor.createdAt).format('DD/MM/YYYY')}
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
          count={fornecedores.length}
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

FornecedoresTable.propTypes = {
  className: PropTypes.string,
  fornecedores: PropTypes.array.isRequired
};

export default FornecedoresTable;
