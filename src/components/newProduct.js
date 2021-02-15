/* eslint-disable react/no-array-index-key */
/* eslint-disable react/button-has-type */
/* eslint-disable react/prop-types */
import React, { useState, useContext } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Snackbar,
} from '@material-ui/core';
import ImageUploading from 'react-images-uploading';
import * as Yup from 'yup';
import { Formik } from 'formik';
import Alert from '@material-ui/lab/Alert';
import { NewPacients } from '../api/pacient';
import { TokenContext } from '../lib/context/contextToken';

const NewProduct = ({ setActualizarPacient }) => {
  const { token } = useContext(TokenContext);
  const [visible, setVisible] = useState(false);
  const [CategoryAnimal] = useState('');
  const [images, setImages] = React.useState([]);
  const [feedback, setFeedback] = useState({
    type: '',
    content: '',
  });

  const onChange = (imageList, addUpdateIndex) => {
    // data for submit
    console.log(imageList, addUpdateIndex);
    setImages(imageList);
  };

  return (
    <>
      <Formik
        initialValues={{
          source: '',
          name: '',
          stock: 0,
        }}
        validationSchema={
                Yup.object().shape({
                  emailPerson: Yup.string().email('Must be a valid email').max(100).required('El email es requerido'),
                  tipo: Yup.string().max(100).required('El tipo de animal es requerido'),
                  idCategory: Yup.string().max(25),
                  nombre: Yup.string().max(50),
                  avatar: Yup.string().max(350),
                  altura: Yup.number().required('Esta opcion es requerida'),
                  peso: Yup.number().required('Esta opcion es requerida'),
                })
              }
        onSubmit={(values, actions) => {
          setTimeout(async () => {
            console.log(values);
            values.idCategory = CategoryAnimal;
            try {
              await NewPacients(token, values);
              setFeedback({
                type: 'success',
                content: 'Se registro un nuevo mascota.',
              });
              setActualizarPacient(true);
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
            <ImageUploading
              multiple
              value={images}
              onChange={onChange}
              maxNumber={2}
              dataURLKey="data_url"
            >
              {({
                imageList,
                onImageUpload,
                onImageUpdate,
                onImageRemove,
                isDragging,
                dragProps,
              }) => (
                // write your building UI
                <div className="upload__image-wrapper">
                  <button
                    style={isDragging ? { color: 'red' } : undefined}
                    onClick={onImageUpload}
                    {...dragProps}
                  >
                    Seleccionar imagen
                  </button>
                    &nbsp;
                  {imageList.map((image, index) => (
                    <div key={index} className="image-item">
                      <img src={image.data_url} alt="" width="100" />
                      <div className="image-item__btn-wrapper">
                        <button onClick={() => onImageUpdate(index)}>Cambiar</button>
                        <button onClick={() => onImageRemove(index)}>Quitar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ImageUploading>
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
              label="Altura"
              margin="normal"
              name="stock"
              onBlur={handleBlur}
              onChange={handleChange}
              type="number"
              value={values.stock}
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
