/* eslint-disable no-alert */
/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {
  Box,
  Button,
  TextField,
  makeStyles
} from '@material-ui/core';
import NewVacunaPacient from '../../../components/newVacunaPaciente';
import ModalElement from '../../../components/Modal';

const useStyles = makeStyles((theme) => ({
  root: {},
  importButton: {
    marginRight: theme.spacing(1)
  },
  exportButton: {
    marginRight: theme.spacing(1)
  }
}));

const Toolbar = ({
  className, setActualizarCalendario, tipo, idPacient, ...rest
}) => {
  const [temperatura, setTemperatura] = useState(0);
  const [isValidate, setIsValidate] = useState(false);
  const [modal, setModal] = useState(false);
  const classes = useStyles();

  const validar = () => {
    if (temperatura >= 37.5 && temperatura <= 39) {
      setIsValidate(true);
    } else {
      alert('La temperatura no es normal, la vacunacion puede ser peligroso para la mascota');
    }
  };

  return (
    <div
      className={clsx(classes.root, className)}
      {...rest}
    >
      <Box
        display="flex"
        justifyContent="flex-end"
      >
        <Button
          color="primary"
          variant="contained"
          onClick={() => setModal(true)}
        >
          Registrar Vacuna
        </Button>
      </Box>

      <ModalElement visible={modal} setVisible={setModal}>
        {!isValidate ? (
          <>
            <TextField
              fullWidth
              label="Temperatura"
              margin="normal"
              variant="outlined"
              onChange={(event) => setTemperatura(event.target.value)}
            />

            <Button variant="contained" color="secondary" onClick={validar}>
              Validar
            </Button>
          </>
        ) : (
          <NewVacunaPacient
            tipo={tipo}
            idPacient={idPacient}
            setActualizarCalendario={setActualizarCalendario}
          />
        ) }
      </ModalElement>
    </div>
  );
};

Toolbar.propTypes = {
  className: PropTypes.string
};

export default Toolbar;
