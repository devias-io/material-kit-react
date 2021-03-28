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
import * as Yup from 'yup';
import { Formik } from 'formik';
import Alert from '@material-ui/lab/Alert';
import { updateSeguimiento } from '../api/seguimiento';
import { TokenContext } from '../lib/context/contextToken';

const UpdateHistory = ({ title, idSeguimiento }) => {
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
          title: '',
        }}
        validationSchema={
                Yup.object().shape({
                  title: Yup.string().max(50),
                })
              }
        onSubmit={(values, actions) => {
          setTimeout(async () => {
            try {
              await updateSeguimiento(token, values.title, idSeguimiento);
              setFeedback({
                type: 'success',
                content: 'Se actualizo el historial clinico.',
              });
              setVisible(false);
              window.location.reload();
            } catch (error) {
              setFeedback({
                type: 'error',
                content: `${error.message} Error al actualizar.`,
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
                Actualizar registro
              </Typography>
            </Box>
            <TextField
              error={Boolean(touched.title && errors.title)}
              fullWidth
              helperText={touched.title && errors.title}
              margin="normal"
              name="title"
              defaultValue={title}
              onBlur={handleBlur}
              onChange={handleChange}
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
                Actualizar
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

export default UpdateHistory;
