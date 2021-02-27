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
  Checkbox,
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
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);
  const [dialogo, setDialogo] = useState(false);
  const [IsDelete, setIsDelete] = useState(false);
  const [IdPacient, setIdPacient] = useState('');
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(0);

  const handleSelectAll = (event) => {
    let newSelectedCustomerIds;

    if (event.target.checked) {
      newSelectedCustomerIds = pacient.map((customer) => customer.id);
    } else {
      newSelectedCustomerIds = [];
    }

    setSelectedCustomerIds(newSelectedCustomerIds);
  };

  const handleSelectOne = (event, id) => {
    const selectedIndex = selectedCustomerIds.indexOf(id);
    let newSelectedCustomerIds = [];

    if (selectedIndex === -1) {
      newSelectedCustomerIds = newSelectedCustomerIds.concat(selectedCustomerIds, id);
    } else if (selectedIndex === 0) {
      newSelectedCustomerIds = newSelectedCustomerIds.concat(selectedCustomerIds.slice(1));
    } else if (selectedIndex === selectedCustomerIds.length - 1) {
      newSelectedCustomerIds = newSelectedCustomerIds.concat(selectedCustomerIds.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelectedCustomerIds = newSelectedCustomerIds.concat(
        selectedCustomerIds.slice(0, selectedIndex),
        selectedCustomerIds.slice(selectedIndex + 1)
      );
    }

    setSelectedCustomerIds(newSelectedCustomerIds);
  };

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
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedCustomerIds.length === pacient.length}
                      color="primary"
                      indeterminate={
                        selectedCustomerIds.length > 0
                        && selectedCustomerIds.length < pacient.length
                      }
                      onChange={handleSelectAll}
                    />
                  </TableCell>
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
                    selected={selectedCustomerIds.indexOf(paciente.idUser) !== -1}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedCustomerIds.indexOf(paciente.idUser) !== -1}
                        onChange={(event) => handleSelectOne(event, paciente.idUser)}
                        value="true"
                      />
                    </TableCell>
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
        <p>Estas seguro que quieres eliminar este registro?, uns vez echo sera irrecuperable.</p>
      </AlertDialog>
    </>
  );
};

Results.propTypes = {
  className: PropTypes.string,
  customers: PropTypes.array.isRequired
};

export default Results;
