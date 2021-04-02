/* eslint-disable react/prop-types */
/* eslint-disable react-hooks/rules-of-hooks */
import React, { useContext, useState } from 'react';
import * as Yup from 'yup';
import { Formik } from 'formik';
import Alert from '@material-ui/lab/Alert';
import {
  Box,
  Button,
  MenuItem,
  Select,
  Typography,
  InputLabel,
  FormControl,
  Snackbar,
  TextField,
} from '@material-ui/core';
import { TokenContext } from '../lib/context/contextToken';
import { UpdateProduct } from '../api/products';

const UpdateFormProduct = ({ product, setActualizarProducts }) => {
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
                  stock: Yup.number(),
                  tipo: Yup.string(),
                  description: Yup.string(),
                })
              }
        onSubmit={async (values, actions) => {
          if (values.name) {
            product.name = values.name;
          }

          if (values.stock) {
            product.stock = values.stock;
          }

          if (values.description) {
            product.description = values.description;
          }

          if (values.tipo) {
            product.tipo = values.tipo;
          }

          try {
            await UpdateProduct(token, product.idProducts, product);
            setFeedback({
              type: 'success',
              content: 'Se actualizo el producto.',
            });
            setVisible(false);
            setActualizarProducts(true);
          } catch (error) {
            setFeedback({
              type: 'error',
              content: `${error.message}.`,
            });
          }
          actions.setSubmitting(false);
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
                Actualizar Producto
              </Typography>
            </Box>
            <TextField
              error={Boolean(touched.name && errors.name)}
              fullWidth
              helperText={touched.name && errors.name}
              label="Nombre"
              margin="normal"
              name="name"
              onBlur={handleBlur}
              onChange={handleChange}
              placeholder={values.name}
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
              placeholder={values.stock}
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
              placeholder={values.description}
              variant="outlined"
            />
            <FormControl style={{ width: 200, marginBottom: 10 }}>
              <InputLabel id="demo-simple-select-label">Medicamento para</InputLabel>
              <Select
                error={Boolean(touched.tipo && errors.tipo)}
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                name="tipo"
                onChange={handleChange}
                onBlur={handleBlur}
              >
                <MenuItem value="Gato">Gato</MenuItem>
                <MenuItem value="Perro">Perro</MenuItem>
                <MenuItem value="Loro">Loro</MenuItem>
                <MenuItem value="Gallo">Gallo</MenuItem>
                <MenuItem value="Conejo">Conejo</MenuItem>
                <MenuItem value="Cerdo">Cerdo</MenuItem>
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
                Actualizar Producto
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

export default UpdateFormProduct;
