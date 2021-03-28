/* eslint-disable camelcase */
/* eslint-disable consistent-return */
/* eslint-disable no-alert */
/* eslint-disable react/no-array-index-key */
/* eslint-disable react/button-has-type */
/* eslint-disable react/prop-types */
import React, { useEffect, useState, useContext } from 'react';
import {
  Box,
  Button,
  Select,
  MenuItem,
  InputLabel,
  TextField,
  FormControl,
  makeStyles,
  Typography,
  Snackbar,
} from '@material-ui/core';
import * as Yup from 'yup';
import { Formik } from 'formik';
import Alert from '@material-ui/lab/Alert';
import { NewCita } from '../api/citas';
import { GetPacients } from '../api/pacient';
import { TokenContext } from '../lib/context/contextToken';
import { fecha_actual } from '../utils/fechas';

const useStyles = makeStyles((theme) => ({
  textField: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    width: 200,
  },
}));

const NewCitas = ({ setActualizarCitas }) => {
  const classes = useStyles();
  const { token } = useContext(TokenContext);
  const [visible, setVisible] = useState(false);
  const [Pacientes, setPacientes] = useState([]);
  const [feedback, setFeedback] = useState({
    type: '',
    content: '',
  });

  useEffect(() => {
    const fetchMascotas = async () => {
      const { users } = await (await GetPacients(token)).data;
      setPacientes(users);
    };

    fetchMascotas();
  }, []);

  return (
    <>
      <Formik
        initialValues={{
          solicitado: '',
          time: '',
          observaciones: '',
          direccion: '',
          idPacient: ''
        }}
        validationSchema={
                Yup.object().shape({
                  solicitado: Yup.string().required('Esta opcion es requerida'),
                  time: Yup.string().required('Esta opcion es requerida'),
                  observaciones: Yup.string().required('Esta opcion es requerida'),
                  direccion: Yup.string().required('Esta opcion es requerida'),
                  idPacient: Yup.string(),
                })
              }
        onSubmit={(values, actions) => {
          setTimeout(async () => {
            try {
              if (values.solicitado <= fecha_actual()) {
                alert('Escoja una fecha mayor');
                actions.setSubmitting(false);
                return false;
              }

              await NewCita(token, values);
              setFeedback({
                type: 'success',
                content: 'Se registro la cita, espere la confirmacion de algun veterinario.',
              });
              setVisible(false);
              setActualizarCitas(true);
            } catch (error) {
              setFeedback({
                type: 'error',
                content: `${error.message} Posiblemente esta fecha ya este ocupado.`,
              });
            }
            setVisible(true);
            actions.setSubmitting(false);
          }, 2000);
        }}
      >
        {({
          errors,
          handleBlur,
          handleChange,
          handleSubmit,
          isSubmitting,
          touched,
        }) => (
          <form onSubmit={handleSubmit}>
            <Box mb={3}>
              <Typography
                color="textPrimary"
                variant="h2"
              >
                Crear nueva cita
              </Typography>
              <Typography
                color="textSecondary"
                gutterBottom
                variant="body2"
              >
                Solicita una cita y un veterinario te visitara.
              </Typography>
            </Box>
            <TextField
              error={Boolean(touched.solicitado && errors.solicitado)}
              fullWidth
              helperText={touched.solicitado && errors.solicitado}
              id="date"
              label="Fecha"
              type="date"
              name="solicitado"
              onBlur={handleBlur}
              onChange={handleChange}
              variant="outlined"
              className={classes.textField}
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              error={Boolean(touched.time && errors.time)}
              fullWidth
              helperText={touched.time && errors.time}
              label="Hora"
              name="time"
              onBlur={handleBlur}
              onChange={handleChange}
              type="time"
              className={classes.textField}
              variant="outlined"
            />
            <TextField
              error={Boolean(touched.observaciones && errors.observaciones)}
              fullWidth
              helperText={touched.observaciones && errors.observaciones}
              label="Observaciones"
              margin="normal"
              name="observaciones"
              onBlur={handleBlur}
              onChange={handleChange}
              type="text"
              variant="outlined"
            />
            <TextField
              error={Boolean(touched.direccion && errors.direccion)}
              fullWidth
              helperText={touched.direccion && errors.direccion}
              label="Direccion"
              margin="normal"
              name="direccion"
              onBlur={handleBlur}
              onChange={handleChange}
              type="text"
              variant="outlined"
            />
            <FormControl style={{ width: 200, marginBottom: 10 }}>
              <InputLabel id="demo-simple-select-label">Mascotas</InputLabel>
              <Select
                error={Boolean(touched.idPacient && errors.idPacient)}
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                name="idPacient"
                onChange={handleChange}
                onBlur={handleBlur}
              >
                {Pacientes.map((item) => <MenuItem value={item.idPacient}>{item.nombre}</MenuItem>)}
              </Select>
            </FormControl>
            <Box my={2}>
              <Button
                color="primary"
                disabled={isSubmitting}
                fullWidth
                size="large"
                type="submit"
                variant="contained"
              >
                Registrar cita
              </Button>
            </Box>
          </form>
        )}
      </Formik>

      <Snackbar open={visible} autoHideDuration={6000} onClose={() => setVisible(false)}>
        <Alert onClose={() => setVisible(false)} severity={feedback.type}>
          {feedback.content}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NewCitas;
