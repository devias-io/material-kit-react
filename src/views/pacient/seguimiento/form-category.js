/* eslint-disable react/prop-types */
import React, { useState, useContext } from 'react';
import * as Yup from 'yup';
import { Formik } from 'formik';
import Alert from '@material-ui/lab/Alert';
import {
  Box,
  Button,
  FormControl,
  RadioGroup,
  Radio,
  TextField,
  FormControlLabel,
  Typography,
  Snackbar,
} from '@material-ui/core';
import { newSeguimiento } from '../../../api/seguimiento';
import { TokenContext } from '../../../lib/context/contextToken';

const Alimentacion = ({ select, idPacient, setActualizarSeguimiento }) => {
  const { token } = useContext(TokenContext);
  const [visible, setVisible] = useState(false);
  const [feedback, setFeedback] = useState({
    type: '',
    content: '',
  });

  const renderRadios = (handleChange) => {
    switch (select) {
      case 'Alimentacion':
        return (
          <FormControl component="fieldset">
            <RadioGroup aria-label="gender" name="title" onChange={handleChange}>
              <FormControlLabel value="Balanceada" control={<Radio />} label="Balanceada" />
              <FormControlLabel value="Casera" control={<Radio />} label="Casera" />
              <FormControlLabel value="Mixta" control={<Radio />} label="Mixta" />
            </RadioGroup>
          </FormControl>
        );
      case 'Reproduccion':
        return (
          <FormControl component="fieldset">
            <RadioGroup aria-label="gender" name="title" onChange={handleChange}>
              <FormControlLabel value="Castrado" control={<Radio />} label="Castrado" />
              <FormControlLabel value="Gestacion" control={<Radio />} label="Gestacion" />
              <FormControlLabel value="Entero" control={<Radio />} label="Entero" />
              <FormControlLabel value="Lactancia" control={<Radio />} label="Lactancia" />
            </RadioGroup>
          </FormControl>
        );
      case 'Habitat':
        return (
          <FormControl component="fieldset">
            <RadioGroup aria-label="gender" name="title" onChange={handleChange}>
              <FormControlLabel value="Casa" control={<Radio />} label="Casa" />
              <FormControlLabel value="Lote" control={<Radio />} label="Lote" />
              <FormControlLabel value="Finca" control={<Radio />} label="Finca" />
              <FormControlLabel value="Taller" control={<Radio />} label="Taller" />
              <FormControlLabel value="Otro" control={<Radio />} label="Otro" />
            </RadioGroup>
          </FormControl>
        );
      case 'Actitud':
        return (
          <FormControl component="fieldset">
            <RadioGroup aria-label="gender" name="title" onChange={handleChange}>
              <FormControlLabel value="Astenico" control={<Radio />} label="Astenico" />
              <FormControlLabel value="Apopletico" control={<Radio />} label="Apopletico" />
              <FormControlLabel value="Linfatico" control={<Radio />} label="Linfatico" />
            </RadioGroup>
          </FormControl>
        );
      case 'Corporal':
        return (
          <FormControl component="fieldset">
            <RadioGroup aria-label="gender" name="title" onChange={handleChange}>
              <FormControlLabel value="Caquectico" control={<Radio />} label="Caquectico" />
              <FormControlLabel value="Delgado" control={<Radio />} label="Delgado" />
              <FormControlLabel value="Normal" control={<Radio />} label="Normal" />
            </RadioGroup>
          </FormControl>
        );
      case 'Hidratacion':
        return (
          <FormControl component="fieldset">
            <RadioGroup aria-label="gender" name="title" onChange={handleChange}>
              <FormControlLabel value="0-5%" control={<Radio />} label="0-5%" />
              <FormControlLabel value="6-7%" control={<Radio />} label="6-7%" />
              <FormControlLabel value="8-9%" control={<Radio />} label="8-9%" />
              <FormControlLabel value="+10%" control={<Radio />} label="+10%" />
              <FormControlLabel value="Normal" control={<Radio />} label="Normal" />
            </RadioGroup>
          </FormControl>
        );
      default:
        return (
          <TextField
            fullWidth
            margin="normal"
            name="title"
            onChange={handleChange}
            variant="outlined"
          />
        );
    }
  };

  return (
    <>
      <Formik
        initialValues={{
          title: ''
        }}
        validationSchema={
              Yup.object().shape({
                title: Yup.string().max(1000).required('Las opciones son requeridos'),
              })
            }
        onSubmit={(values, actions) => {
          setTimeout(async () => {
            console.log(values);

            const data = {
              idPacient,
              title: values.title,
              category: select,
            };

            try {
              await newSeguimiento(token, data);
              setFeedback({
                type: 'success',
                content: 'Se registro el seguimiento.',
              });

              setActualizarSeguimiento(true);
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
          handleChange,
          handleSubmit,
          isSubmitting,
        }) => (
          <form onSubmit={handleSubmit}>
            <Box mb={3}>
              <Typography
                color="textPrimary"
                variant="h2"
              >
                {select}
              </Typography>
              <Typography
                color="textSecondary"
                gutterBottom
                variant="body2"
              >
                Seguimiento de
                {' '}
                {select}
              </Typography>
            </Box>
            {renderRadios(handleChange)}
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

export default Alimentacion;
