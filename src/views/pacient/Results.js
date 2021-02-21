/* eslint-disable react/prop-types */
import React, { useState } from 'react';
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
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  makeStyles
} from '@material-ui/core';
import getInitials from 'src/utils/getInitials';

const useStyles = makeStyles((theme) => ({
  root: {},
  avatar: {
    marginRight: theme.spacing(2)
  }
}));

const Results = ({
  className, pacient, searchPacient, ...rest
}) => {
  const classes = useStyles();
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);
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
  );
};

Results.propTypes = {
  className: PropTypes.string,
  customers: PropTypes.array.isRequired
};

export default Results;
