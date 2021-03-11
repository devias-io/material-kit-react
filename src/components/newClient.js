/* eslint-disable react/prop-types */
import React, { useState, useContext } from 'react';
import {
  Box,
  Button,
  Select,
  TextField,
  FormControl,
  MenuItem,
  InputLabel,
  Typography,
  Snackbar,
} from '@material-ui/core';
import * as Yup from 'yup';
import { Formik } from 'formik';
import Alert from '@material-ui/lab/Alert';
import { NewUser } from '../api/users';
import { TokenContext } from '../lib/context/contextToken';

const CreateNewClient = ({ setActualizarUser }) => {
  const { token } = useContext(TokenContext);
  const [visible, setVisible] = useState(false);
  const [feedback, setFeedback] = useState({
    type: '',
    content: '',
  });

  return (
    <>
      <Formik
        initialValues={{
          email: '',
          userName: '',
          Phone: '',
          Cedula: '',
          admin: '',
        }}
        validationSchema={
              Yup.object().shape({
                email: Yup.string().email('Must be a valid email').max(100).required('El email es requerido'),
                userName: Yup.string().max(100).required('El nombre de usuario es requerido'),
                Phone: Yup.string().max(10).required('El telefono del usuario es requerido'),
                Cedula: Yup.string().max(10).required('La cedula del usuario es requerido'),
                admin: Yup.string().required('Esta opcion es requerida'),
              })
            }
        onSubmit={(values, actions) => {
          setTimeout(async () => {
            console.log(values);
            values.admin = values.admin === 'Administrador';
            try {
              await NewUser(token, values);
              setFeedback({
                type: 'success',
                content: 'Se registro un nuevo cliente.',
              });
              setActualizarUser(true);
            } catch (error) {
              setFeedback({
                type: 'error',
                content: `${error.message} Posiblemente este usuario ya existe.`,
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
          values
        }) => (
          <form onSubmit={handleSubmit}>
            <Box mb={3}>
              <Typography
                color="textPrimary"
                variant="h2"
              >
                Crear nuevo cliente
              </Typography>
              <Typography
                color="textSecondary"
                gutterBottom
                variant="body2"
              >
                Usa una direccion de correo activa y verificada
              </Typography>
            </Box>
            <TextField
              error={Boolean(touched.userName && errors.userName)}
              fullWidth
              helperText={touched.userName && errors.userName}
              label="User Name"
              margin="normal"
              name="userName"
              onBlur={handleBlur}
              onChange={handleChange}
              value={values.userName}
              variant="outlined"
            />
            <TextField
              error={Boolean(touched.email && errors.email)}
              fullWidth
              helperText={touched.email && errors.email}
              label="Email Address"
              margin="normal"
              name="email"
              onBlur={handleBlur}
              onChange={handleChange}
              type="email"
              value={values.email}
              variant="outlined"
            />
            <TextField
              error={Boolean(touched.Phone && errors.Phone)}
              fullWidth
              helperText={touched.Phone && errors.Phone}
              label="Telefono"
              margin="normal"
              name="Phone"
              onBlur={handleBlur}
              onChange={handleChange}
              type="number"
              value={values.Phone}
              variant="outlined"
            />
            <TextField
              error={Boolean(touched.Cedula && errors.Cedula)}
              fullWidth
              helperText={touched.Cedula && errors.Cedula}
              label="Cedula"
              margin="normal"
              name="Cedula"
              onBlur={handleBlur}
              onChange={handleChange}
              type="number"
              value={values.Cedula}
              variant="outlined"
            />
            <FormControl style={{ width: 250, marginBottom: 10 }}>
              <InputLabel id="demo-simple-select-label">Tipo de usuario</InputLabel>
              <Select
                error={Boolean(touched.admin && errors.admin)}
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                name="admin"
                onBlur={handleBlur}
                onChange={handleChange}
              >
                <MenuItem value="Cliente">Cliente</MenuItem>
                <MenuItem value="Administrador">Administrador</MenuItem>
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
                Registrar
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

export default CreateNewClient;
