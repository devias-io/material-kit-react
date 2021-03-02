/* eslint-disable no-unused-expressions */
/* eslint-disable react/prop-types */
import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Button,
  FormControl,
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
import { TokenContext } from '../lib/context/contextToken';
import { GetVacunasTipos, CreateVacunaPacient } from '../api/vacunas';
import { getProducts } from '../api/products';

const NewVacunaPacient = ({ setActualizarCalendario, tipo, idPacient }) => {
  const { token } = useContext(TokenContext);
  const [visible, setVisible] = useState(false);
  const [SelectVacunas, setVacunas] = useState([]);
  const [SelectProductos, setProductos] = useState([]);
  const [feedback, setFeedback] = useState({
    type: '',
    content: '',
  });

  useEffect(() => {
    try {
      const fetchVacunas = async () => {
        const { vacunas } = await (await GetVacunasTipos(token, idPacient)).data;
        setVacunas(vacunas);

        const { products } = await (await getProducts(token)).data;
        setProductos(products);
      };

      tipo && fetchVacunas();
    } catch (error) {
      console.log(error.message);
    }
  }, [tipo]);

  return (
    <>
      <Formik
        initialValues={{
          id_vacuna: '',
          idProducts: '',
        }}
        validationSchema={
                Yup.object().shape({
                  id_vacuna: Yup.string().max(100).required('La vacuna del animal es requerido'),
                  idProducts: Yup.string().max(100).required('El produtcto para la vacuna es requerido'),
                })
              }
        onSubmit={(values, actions) => {
          setTimeout(async () => {
            values.idPacient = idPacient;
            console.log(values);

            try {
              await CreateVacunaPacient(token, values);
              setFeedback({
                type: 'success',
                content: 'Se registro la vacuna para la mascota.',
              });
              setActualizarCalendario(true);
              setVisible(true);
            } catch (error) {
              setFeedback({
                type: 'error',
                content: `${error.message}`,
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
                Registrar vacuna a mascota
              </Typography>
              <Typography
                color="textSecondary"
                gutterBottom
                variant="body2"
              >
                Registra toda las vacunas que le toca a la mascota.
              </Typography>
            </Box>
            <Grid container spacing={1}>
              <Grid item md={5}>
                <FormControl style={{ width: 200, marginBottom: 10 }}>
                  <InputLabel id="demo-simple-select-label">Vacunas</InputLabel>
                  <Select
                    error={Boolean(touched.id_vacuna && errors.id_vacuna)}
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    name="id_vacuna"
                    onChange={handleChange}
                    onBlur={handleBlur}
                  >
                    {SelectVacunas.map((vacuna) => (
                      <MenuItem value={vacuna.id_vacuna}>{`${vacuna.nombres} - ${vacuna.edad}`}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item md={5}>
                <FormControl style={{ width: 200, marginBottom: 10 }}>
                  <InputLabel id="demo-simple-select-label">Productos</InputLabel>
                  <Select
                    error={Boolean(touched.idProducts && errors.idProducts)}
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    name="idProducts"
                    onChange={handleChange}
                    onBlur={handleBlur}
                  >
                    {SelectProductos.map((product) => (
                      <MenuItem value={product.idProducts}>{product.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
                Registrar vacuna
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

export default NewVacunaPacient;
