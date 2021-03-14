/* eslint-disable react/prop-types */
import React, { useState, useEffect, useContext } from 'react';
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
  Grid,
} from '@material-ui/core';
import * as Yup from 'yup';
import { Formik } from 'formik';
import Alert from '@material-ui/lab/Alert';
import { NewPacients } from '../api/pacient';
import { TokenContext } from '../lib/context/contextToken';
import {
  razasPerro, razasGato, razaConejo, razaGallo, razaLoros
} from '../utils/razas';

const NewPacient = ({ setActualizarPacient }) => {
  const { token } = useContext(TokenContext);
  const [visible, setVisible] = useState(false);
  const [CategoryAnimal, setCategoryAnimal] = useState('');
  const [selectTipo, setSelectTipo] = useState('');
  const [TipoAnimal, setTipooAnimal] = useState([]);
  const [RazaAnimal, setRazaAnimal] = useState([]);
  const [feedback, setFeedback] = useState({
    type: '',
    content: '',
  });

  useEffect(() => {
    switch (CategoryAnimal) {
      case 'iiwnfiwls':
        setTipooAnimal([
          'Vacas y toros',
          'Cabras y chivos',
          'Cerdos',
          'Ovejas',
          'Aves de corral',
          'Abejas',
          'Peces'
        ]);
        break;
      case 'fejfwnnau':
        setTipooAnimal([
          'Conejo',
          'Gato',
          'Gallo',
          'Perro',
          'Loro',
          'Palomas',
          'Pavo',
        ]);
        break;
      default:
        setTipooAnimal([]);
    }
  }, [CategoryAnimal]);

  useEffect(() => {
    switch (selectTipo) {
      case 'Perro':
        setRazaAnimal(razasPerro);
        break;
      case 'Gato':
        setRazaAnimal(razasGato);
        break;
      case 'Conejo':
        setRazaAnimal(razaConejo);
        break;
      case 'Gallo':
        setRazaAnimal(razaGallo);
        break;
      case 'Loro':
        setRazaAnimal(razaLoros);
        break;
      default:
        setRazaAnimal([]);
    }
  }, [selectTipo]);

  return (
    <>
      <Formik
        initialValues={{
          tipo: '',
          idCategory: '',
          nombre: '',
          altura: '',
          peso: '',
          sexo: '',
          emailPerson: '',
          nacimiento: '',
          avatar: '',
          raza: '',
        }}
        validationSchema={
                Yup.object().shape({
                  emailPerson: Yup.string().email('Must be a valid email').max(100).required('El email es requerido'),
                  tipo: Yup.string().max(100),
                  nacimiento: Yup.string().max(100).required('El nacimiento del animal es requerido'),
                  sexo: Yup.string().max(100).required('El sexo del animal es requerido'),
                  idCategory: Yup.string().max(25),
                  nombre: Yup.string().max(50),
                  avatar: Yup.string().max(350),
                  raza: Yup.string().required('Esta opcion es requerida'),
                  altura: Yup.number().required('Esta opcion es requerida'),
                  peso: Yup.number().required('Esta opcion es requerida'),
                })
              }
        onSubmit={(values, actions) => {
          setTimeout(async () => {
            console.log(values);
            values.idCategory = CategoryAnimal;
            values.tipo = selectTipo;

            try {
              await NewPacients(token, values);
              setFeedback({
                type: 'success',
                content: 'Se registro un nuevo mascota.',
              });
              setActualizarPacient(true);
              setVisible(true);
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
                Registra alguna mascota con o sin dueño.
              </Typography>
            </Box>
            <Grid container spacing={1}>
              <Grid item md={5}>
                <FormControl style={{ width: 200, marginBottom: 10 }}>
                  <InputLabel id="demo-simple-select-label">Categoria</InputLabel>
                  <Select
                    error={Boolean(touched.idCategory && errors.idCategory)}
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={CategoryAnimal}
                    name="idCategory"
                    onChange={(e) => setCategoryAnimal(e.target.value)}
                    onBlur={handleBlur}
                  >
                    <MenuItem value="fejfwnnau">De Compania</MenuItem>
                    <MenuItem value="iiwnfiwls">De Granja</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item md={5}>
                <FormControl style={{ width: 250, marginBottom: 10 }}>
                  <InputLabel id="demo-simple-select-label">Tipo</InputLabel>
                  <Select
                    error={Boolean(touched.tipo && errors.tipo)}
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={selectTipo}
                    name="tipo"
                    onChange={(e) => {
                      setSelectTipo(e.target.value);
                    }}
                    onBlur={handleBlur}
                  >
                    {TipoAnimal.map((item) => (
                      <MenuItem value={item}>{item}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Grid container spacing={1}>
              <Grid item md={5}>
                <FormControl style={{ width: 200, marginBottom: 10 }}>
                  <InputLabel id="demo-simple-select-label">Raza</InputLabel>
                  <Select
                    error={Boolean(touched.raza && errors.raza)}
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={values.raza}
                    name="raza"
                    onChange={handleChange}
                    onBlur={handleBlur}
                  >
                    {RazaAnimal.map((item) => (
                      <MenuItem value={item}>{item}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item md={5}>
                <FormControl style={{ width: 250, marginBottom: 10 }}>
                  <InputLabel id="demo-simple-select-label">Sexo</InputLabel>
                  <Select
                    error={Boolean(touched.sexo && errors.sexo)}
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={values.sexo}
                    name="sexo"
                    onChange={handleChange}
                    onBlur={handleBlur}
                  >
                    <MenuItem value="Macho">Macho</MenuItem>
                    <MenuItem value="Hembra">Hembra</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Grid container spacing={3}>
              <Grid item xs={6}>
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
              </Grid>
              <Grid item xs={6}>
                <TextField
                  error={Boolean(touched.avatar && errors.avatar)}
                  fullWidth
                  helperText={touched.avatar && errors.avatar}
                  label="Fotografia de la mascota"
                  margin="normal"
                  name="avatar"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.avatar}
                  variant="outlined"
                />
              </Grid>
            </Grid>
            <Grid container spacing={3}>
              <Grid item xs={6}>
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
                  value={values.altura}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={6}>
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
                  value={values.peso}
                  variant="outlined"
                />
              </Grid>
            </Grid>
            <Grid container spacing={3}>
              <Grid item xs={6}>
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
                  value={values.emailPerson}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  error={Boolean(touched.nacimiento && errors.nacimiento)}
                  fullWidth
                  helperText={touched.nacimiento && errors.nacimiento}
                  id="date"
                  label="Nacimiento"
                  type="date"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  margin="normal"
                  name="nacimiento"
                  defaultValue={values.nacimiento}
                  variant="outlined"
                />
              </Grid>
            </Grid>
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
