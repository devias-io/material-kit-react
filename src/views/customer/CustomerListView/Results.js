/* eslint-disable no-unused-expressions */
/* eslint-disable react/prop-types */
import React, { useState, useEffect, useContext } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import moment from 'moment';
import PerfectScrollbar from 'react-perfect-scrollbar';
import {
  Avatar,
  Box,
  Card,
  Table,
  Button,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  makeStyles
} from '@material-ui/core';
import getInitials from 'src/utils/getInitials';
import AlertDialog from '../../../components/dialogo';
import { TokenContext } from '../../../lib/context/contextToken';
import { DeleteUser } from '../../../api/users';

const useStyles = makeStyles((theme) => ({
  root: {},
  avatar: {
    marginRight: theme.spacing(2)
  }
}));

const Results = ({
  className, customers, setActualizarUser, searchUser, ...rest
}) => {
  const classes = useStyles();
  const [dialogo, setDialogo] = useState(false);
  const [isDelete, setIsDelete] = useState(false);
  const [idUser, setIdUser] = useState('');
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(0);
  const { token } = useContext(TokenContext);

  const handleLimitChange = (event) => {
    setLimit(event.target.value);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  useEffect(() => {
    try {
      const deleteUser = async () => {
        await DeleteUser(token, idUser);
        setActualizarUser(true);
      };

      idUser && isDelete && deleteUser();
    } catch (error) {
      console.log(error.message);
    }
  }, [idUser, isDelete]);

  return (
    <Card
      className={clsx(classes.root, className)}
      {...rest}
    >
      <PerfectScrollbar>
        <Box minWidth={1050}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  Name
                </TableCell>
                <TableCell>
                  Email
                </TableCell>
                <TableCell>
                  Proveedor
                </TableCell>
                <TableCell>
                  Phone
                </TableCell>
                <TableCell>
                  Registration date
                </TableCell>
                <TableCell>
                  Opciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.filter((item) => {
                return item.userName.toLowerCase().includes(searchUser.toLowerCase())
                || item.email.toLowerCase().includes(searchUser.toLowerCase());
              }).map((customer) => (
                <TableRow
                  hover
                  key={customer.idUser}
                >
                  <TableCell>
                    <Box
                      alignItems="center"
                      display="flex"
                    >
                      <Avatar
                        className={classes.avatar}
                        src={customer.avatar}
                      >
                        {getInitials(customer.userName)}
                      </Avatar>
                      <Typography
                        color="textPrimary"
                        variant="body1"
                      >
                        {customer.userName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {customer.email}
                  </TableCell>
                  <TableCell>
                    {customer.provider}
                  </TableCell>
                  <TableCell>
                    {customer.Phone || 'Ninnguno'}
                  </TableCell>
                  <TableCell>
                    {moment(customer.created_at).format('DD/MM/YYYY')}
                  </TableCell>
                  <TableCell>
                    <Button size="small" variant="contained" color="primary">
                      Editar
                    </Button>
                    &nbsp; &nbsp;
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => {
                        setDialogo(true);
                        setIdUser(customer.idUser);
                      }}
                    >
                      ELiminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </PerfectScrollbar>
      <TablePagination
        component="div"
        count={customers.length}
        onChangePage={handlePageChange}
        onChangeRowsPerPage={handleLimitChange}
        page={page}
        rowsPerPage={limit}
        rowsPerPageOptions={[5, 10, 25]}
      />
      <AlertDialog visible={dialogo} setVisible={setDialogo} setIsDelete={setIsDelete}>
        <p>Estas seguro que quieres eliminar este registro?, uns vez echo sera irrecuperable.</p>
      </AlertDialog>
    </Card>
  );
};

Results.propTypes = {
  className: PropTypes.string,
  customers: PropTypes.array.isRequired
};

export default Results;
