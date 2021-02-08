import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  TextField,
  Select,
  Typography,
  InputLabel,
  MenuItem,
  Snackbar,
} from '@material-ui/core';
import * as Yup from 'yup';
import { Formik } from 'formik';
import Alert from '@material-ui/lab/Alert';
// import { TokenContext } from '../lib/context/contextToken';

const NewPacient = () => {
// const { token } = useContext(TokenContext);
  const [visible, setVisible] = useState(false);
  const [feedback, setFeedback] = useState({
    type: '',
    content: '',
  });

  return (
    <>
      <Formik
        initialValues={{
          tipo: '',
          idCategory: '',
          nombre: '',
          altura: 0,
          peso: 0,
          emailPerson: '',
          avatar: '',
        }}
        validationSchema={
                Yup.object().shape({
                  emailPerson: Yup.string().email('Must be a valid email').max(100).required('El email es requerido'),
                  tipo: Yup.string().max(100).required('El tipo de animal es requerido'),
                  idCategory: Yup.string().max(10).required('El categoria del animal es requerido'),
                  nombre: Yup.string().max(50),
                  altura: Yup.number().required('Esta opcion es requerida'),
                  peso: Yup.number().required('Esta opcion es requerida'),
                })
              }
        onSubmit={(values, actions) => {
          setTimeout(async () => {
            console.log(values);
            try {
              // await NewPacients(token, values);
              setFeedback({
                type: 'success',
                content: 'Se registro un nuevo mascota.',
              });
              // setActualizarUser(true);
            } catch (error) {
              setFeedback({
                type: 'error',
                content: `${error.message} Posiblemente esta mascota ya existe.`,
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
                Crear nueva mascota
              </Typography>
              <Typography
                color="textSecondary"
                gutterBottom
                variant="body2"
              >
                Usa una direccion de correo activa y verificada
              </Typography>
            </Box>
            <FormControl style={{ width: 320, marginBottom: 20 }}>
              <InputLabel id="demo-simple-select-label">Categoria</InputLabel>
              <Select
                error={Boolean(touched.idCategory && errors.idCategory)}
                helperText={touched.idCategory && errors.idCategory}
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={0}
                name="idCategory"
                onChange={handleChange}
                onBlur={handleBlur}
              >
                <MenuItem value={10}>Ten</MenuItem>
                <MenuItem value={20}>Twenty</MenuItem>
                <MenuItem value={30}>Thirty</MenuItem>
              </Select>
            </FormControl>
            <FormControl style={{ width: 320 }}>
              <InputLabel id="demo-simple-select-label">Tipo</InputLabel>
              <Select
                error={Boolean(touched.tipo && errors.tipo)}
                helperText={touched.tipo && errors.tipo}
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={0}
                name="tipo"
                onChange={handleChange}
                onBlur={handleBlur}
              >
                <MenuItem value={10}>Ten</MenuItem>
                <MenuItem value={20}>Twenty</MenuItem>
                <MenuItem value={30}>Thirty</MenuItem>
              </Select>
            </FormControl>
            <TextField
              error={Boolean(touched.nombre && errors.nombre)}
              fullWidth
              helperText={touched.nombre && errors.nombre}
              label="Nombre"
              margin="normal"
              name="nombre"
              onBlur={handleBlur}
              onChange={handleChange}
              value={values.nombre}
              variant="outlined"
            />
            <TextField
              error={Boolean(touched.altura && errors.altura)}
              fullWidth
              helperText={touched.altura && errors.altura}
              label="Altura"
              margin="normal"
              name="altura"
              onBlur={handleBlur}
              onChange={handleChange}
              type="number"
              value={values.email}
              variant="outlined"
            />
            <TextField
              error={Boolean(touched.peso && errors.peso)}
              fullWidth
              helperText={touched.peso && errors.peso}
              label="Peso"
              margin="normal"
              name="peso"
              onBlur={handleBlur}
              onChange={handleChange}
              type="number"
              value={values.Phone}
              variant="outlined"
            />
            <TextField
              error={Boolean(touched.emailPerson && errors.emailPerson)}
              fullWidth
              helperText={touched.emailPerson && errors.emailPerson}
              label="Email del dueño"
              margin="normal"
              name="emailPerson"
              onBlur={handleBlur}
              onChange={handleChange}
              type="email"
              value={values.Phone}
              variant="outlined"
            />
            <Box my={2}>
              <Button
                color="primary"
                disabled={isSubmitting}
                fullWidth
                size="large"
                type="submit"
                variant="contained"
              >
                Registrar Mascota
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

export default NewPacient;
