/* eslint-disable no-unused-expressions */
/* eslint-disable react/prop-types */
import React, { useEffect, useState, useContext } from 'react';
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
import { Link } from 'react-router-dom';
import getInitials from 'src/utils/getInitials';
import AlertDialog from '../../components/dialogo';
import { RemovePacient } from '../../api/pacient';
import { TokenContext } from '../../lib/context/contextToken';

const useStyles = makeStyles((theme) => ({
  root: {},
  avatar: {
    marginRight: theme.spacing(2)
  }
}));

const Results = ({
  className, pacient, setActualizarPacient, searchPacient, ...rest
}) => {
  const { token } = useContext(TokenContext);
  const classes = useStyles();
  const [dialogo, setDialogo] = useState(false);
  const [IsDelete, setIsDelete] = useState(false);
  const [IdPacient, setIdPacient] = useState('');
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(0);

  const handleLimitChange = (event) => {
    setLimit(event.target.value);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  useEffect(() => {
    try {
      const DeletePacient = async () => {
        await RemovePacient(token, IdPacient);
        setActualizarPacient(true);
      };

      IsDelete && IdPacient && DeletePacient();
    } catch (error) {
      console.log(error.message);
    }
  }, [IsDelete, IdPacient]);

  return (
    <>
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
                    Email Dueño
                  </TableCell>
                  <TableCell>
                    Altura
                  </TableCell>
                  <TableCell>
                    Peso
                  </TableCell>
                  <TableCell>
                    Animal
                  </TableCell>
                  <TableCell>
                    Raza
                  </TableCell>
                  <TableCell>
                    Sexo
                  </TableCell>
                  <TableCell>
                    Registrado el
                  </TableCell>
                  <TableCell>
                    Nacio el
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pacient.filter((item) => {
                  return item.nombre.toLowerCase().includes(searchPacient.toLowerCase())
                  || item.emailPerson.toLowerCase().includes(searchPacient.toLowerCase());
                }).map((paciente) => (
                  <TableRow
                    hover
                    key={paciente.idUser}
                  >
                    <TableCell>
                      <Box
                        alignItems="center"
                        display="flex"
                      >
                        <Avatar
                          className={classes.avatar}
                          src={paciente.avatar}
                        >
                          {getInitials(paciente.nombre)}
                        </Avatar>
                        <Typography
                          color="textPrimary"
                          variant="body1"
                        >
                          {paciente.nombre || 'Sin Nombre'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {paciente.emailPerson || 'Sin Dueño'}
                    </TableCell>
                    <TableCell>
                      {paciente.altura}
                    </TableCell>
                    <TableCell>
                      {paciente.peso}
                    </TableCell>
                    <TableCell>
                      {paciente.tipo}
                    </TableCell>
                    <TableCell>
                      {paciente.raza}
                    </TableCell>
                    <TableCell>
                      {paciente.sexo}
                    </TableCell>
                    <TableCell>
                      {moment(paciente.created_at).format('LLL')}
                    </TableCell>
                    <TableCell>
                      {moment(paciente.nacimiento).format('LL')}
                    </TableCell>
                    <TableCell>
                      <Link to={`/app/pacient/${paciente.idPacient}`}>
                        <Button
                          size="small"
                          variant="contained"
                        >
                          Detalles
                        </Button>
                      </Link>
                      &nbsp; &nbsp;
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => {
                          setDialogo(true);
                          setIdPacient(paciente.idPacient);
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
          count={pacient.length}
          onChangePage={handlePageChange}
          onChangeRowsPerPage={handleLimitChange}
          page={page}
          rowsPerPage={limit}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Card>

      <AlertDialog visible={dialogo} setVisible={setDialogo} setIsDelete={setIsDelete}>
        <p>¿Estás seguro que quieres eliminar este registro?, una vez hecho será irrecuperable.</p>
      </AlertDialog>
    </>
  );
};

Results.propTypes = {
  className: PropTypes.string,
  customers: PropTypes.array.isRequired
};

export default Results;
