/* eslint-disable max-len */
/* eslint-disable no-alert */
/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import clsx from 'clsx';
import {
  Box,
  InputLabel,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Button,
  TextField,
  makeStyles
} from '@material-ui/core';
import TipoSeguimiento from './tipo-seguimiento';
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
  className, setActualizarCalendario, setActualizarSeguimiento, tipo, idPacient, ...rest
}) => {
  const [temperatura, setTemperatura] = useState(0);
  const [selectSeguimiento, setSelectSeguimiento] = useState('');
  const [isValidate, setIsValidate] = useState(false);
  const [modal, setModal] = useState(false);
  const [modalSeguimiento, setModalSeguimiento] = useState(false);
  const classes = useStyles();

  const { me } = useSelector((state) => state.Sesion);

  const validar = () => {
    if (temperatura >= 37.5 && temperatura <= 39) {
      setIsValidate(true);
    } else {
      alert('La temperatura no es normal, la vacunacion puede ser peligroso para la mascota');
    }
  };

  useEffect(() => {
    if (!modalSeguimiento) {
      setSelectSeguimiento('');
    }
  }, [modalSeguimiento]);

  return (
    <div
      className={clsx(classes.root, className)}
      {...rest}
    >
      <Box
        display="flex"
        justifyContent="flex-end"
      >
        {me.isAdmin ? (
          <>
            <Button
              color="primary"
              variant="contained"
              onClick={() => setModalSeguimiento(true)}
            >
              Seguimiento
            </Button>
            &nbsp; &nbsp;
            <Button
              color="primary"
              variant="contained"
              onClick={() => setModal(true)}
            >
              Registrar Vacuna
            </Button>
          </>
        ) : ''}
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

      <ModalElement visible={modalSeguimiento} setVisible={setModalSeguimiento}>
        {selectSeguimiento ? (
          <TipoSeguimiento select={selectSeguimiento} idPacient={idPacient} setActualizarSeguimiento={setActualizarSeguimiento} />
        ) : (
          <>
            <Box mb={3}>
              <Typography
                color="textPrimary"
                variant="h2"
              >
                Seguimientos
              </Typography>
              <Typography
                color="textSecondary"
                gutterBottom
                variant="body2"
              >
                Seleccione la categoria.
              </Typography>
            </Box>
            <FormControl style={{ width: 200, marginBottom: 10 }}>
              <InputLabel id="demo-simple-select-label">Categoria</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                onChange={(e) => setSelectSeguimiento(e.target.value)}
              >
                <MenuItem value="Alimentacion">Alimentación</MenuItem>
                <MenuItem value="Reproduccion">Reproducción</MenuItem>
                <MenuItem value="Habitat">Habitat</MenuItem>
                <MenuItem value="Enfermedades">Enfermedades</MenuItem>
                <MenuItem value="Alergias">Alergias</MenuItem>
                <MenuItem value="Antecedentes">Antecedentes</MenuItem>
                <MenuItem value="Cirugias">Cirugias</MenuItem>
                <MenuItem value="Actitud">Actitud</MenuItem>
                <MenuItem value="Corporal">Condicion Corporal</MenuItem>
                <MenuItem value="Hidratacion">Estado Hidratacion</MenuItem>
                <MenuItem value="Mucosas">Mucosas</MenuItem>
              </Select>
            </FormControl>
          </>
        )}
      </ModalElement>
    </div>
  );
};

Toolbar.propTypes = {
  className: PropTypes.string
};

export default Toolbar;
