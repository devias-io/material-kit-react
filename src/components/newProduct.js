/* eslint-disable react/no-array-index-key */
/* eslint-disable react/button-has-type */
/* eslint-disable react/prop-types */
import React, { useState, useContext } from 'react';
import {
  Box,
  Button,
  Select,
  MenuItem,
  InputLabel,
  TextField,
  FormControl,
  Typography,
  Snackbar,
} from '@material-ui/core';
import * as Yup from 'yup';
import { Formik } from 'formik';
import Alert from '@material-ui/lab/Alert';
import { newProduct } from '../api/products';
import { TokenContext } from '../lib/context/contextToken';

const NewProduct = ({ setActualizarProducts }) => {
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
          name: '',
          stock: '',
          description: '',
          tipo: '',
        }}
        validationSchema={
                Yup.object().shape({
                  name: Yup.string().max(50),
                  stock: Yup.number().required('Esta opcion es requerida'),
                })
              }
        onSubmit={(values, actions) => {
          setTimeout(async () => {
            const img = document.getElementById('foto');

            const form = new FormData();
            form.append('name', values.name);
            form.append('stock', values.stock);
            form.append('source', img.files[0]);
            form.append('description', values.description);
            form.append('tipo', values.tipo);

            try {
              await newProduct(token, form);
              setFeedback({
                type: 'success',
                content: 'Se registro un nuevo producto.',
              });
              setVisible(false);
              setActualizarProducts(true);
            } catch (error) {
              setFeedback({
                type: 'error',
                content: `${error.message} Posiblemente este producto ya existe.`,
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
                Crear nuevo Producto
              </Typography>
              <Typography
                color="textSecondary"
                gutterBottom
                variant="body2"
              >
                Registra producto para mascotas.
              </Typography>
            </Box>
            <input type="file" id="foto" />
            <TextField
              error={Boolean(touched.name && errors.name)}
              fullWidth
              helperText={touched.name && errors.name}
              label="Nombre"
              margin="normal"
              name="name"
              onBlur={handleBlur}
              onChange={handleChange}
              value={values.name}
              variant="outlined"
            />
            <TextField
              error={Boolean(touched.stock && errors.stock)}
              fullWidth
              helperText={touched.stock && errors.stock}
              label="stock"
              margin="normal"
              name="stock"
              onBlur={handleBlur}
              onChange={handleChange}
              type="number"
              value={values.stock}
              variant="outlined"
            />
            <TextField
              error={Boolean(touched.description && errors.description)}
              fullWidth
              helperText={touched.description && errors.description}
              label="Description"
              margin="normal"
              name="description"
              onBlur={handleBlur}
              onChange={handleChange}
              type="text"
              value={values.description}
              variant="outlined"
            />
            <FormControl style={{ width: 200, marginBottom: 10 }}>
              <InputLabel id="demo-simple-select-label">Medicamento para</InputLabel>
              <Select
                error={Boolean(touched.tipo && errors.tipo)}
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={values.tipo}
                name="tipo"
                onChange={handleChange}
                onBlur={handleBlur}
              >
                <MenuItem value="Gato">Gato</MenuItem>
                <MenuItem value="Perro">Perro</MenuItem>
                <MenuItem value="Loro">Loro</MenuItem>
                <MenuItem value="Gallo">Gallo</MenuItem>
                <MenuItem value="Conejo">Conejo</MenuItem>
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
                Registrar Producto
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

export default NewProduct;
