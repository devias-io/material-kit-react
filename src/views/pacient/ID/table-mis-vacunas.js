/* eslint-disable consistent-return */
/* eslint-disable no-unused-expressions */
/* eslint-disable react/prop-types */
import React from 'react';
import moment from 'moment';
import {
  Avatar,
  Box,
  Table,
  Button,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  makeStyles,
  Typography,
} from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import getInitials from '../../../utils/getInitials';

const useStyles = makeStyles((theme) => ({
  root: {},
  avatar: {
    marginRight: theme.spacing(2)
  }
}));

const statusVacunas = (status) => {
  switch (status) {
    case 'Pendiente':
      return 'warning';
    case 'Completado':
      return 'success';
    case 'Retrasado':
      return 'error';
    default: 'info';
  }
};

const TableMisVacunas = ({ vacunas }) => {
  const classes = useStyles();

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>
            Mascota
          </TableCell>
          <TableCell>
            Email Dueño
          </TableCell>
          <TableCell>
            Doctor
          </TableCell>
          <TableCell>
            Vacuna
          </TableCell>
          <TableCell>
            Fecha para vacuna
          </TableCell>
          <TableCell>
            Cantidad
          </TableCell>
          <TableCell>
            Realizado el
          </TableCell>
          <TableCell>
            Estado
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {vacunas.map((vacuna) => (
          <TableRow
            hover
            key={vacuna.id_vacuna}
          >
            <TableCell>
              <Box
                alignItems="center"
                display="flex"
              >
                <Avatar
                  className={classes.avatar}
                  src={vacuna.avatar}
                >
                  {getInitials(vacuna.nombre_paciente)}
                </Avatar>
                <Typography
                  color="textPrimary"
                  variant="body1"
                >
                  {vacuna.nombre_paciente}
                </Typography>
              </Box>
            </TableCell>
            <TableCell>
              {vacuna.emailPerson || 'Sin Dueño'}
            </TableCell>
            <TableCell>
              {vacuna.doctor || 'Sin Doctor'}
            </TableCell>
            <TableCell>
              <strong>{vacuna.nombre}</strong>
            </TableCell>
            <TableCell>
              {vacuna.edad}
            </TableCell>
            <TableCell>
              {vacuna.count}
            </TableCell>
            <TableCell>
              {vacuna.created_at ? moment(vacuna.created_at).format('LLL') : 'Sin fecha'}
            </TableCell>
            <TableCell>
              <Alert severity={statusVacunas(vacuna.isVacuna)}>{vacuna.isVacuna}</Alert>
            </TableCell>
            <TableCell>
              <Button
                size="small"
                variant="contained"
                onClick={() => {
                  console.log('delete mi vacuna');
                }}
              >
                ELiminar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default TableMisVacunas;
