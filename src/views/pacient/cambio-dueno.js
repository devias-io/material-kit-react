/* eslint-disable max-len */
/* eslint-disable react/prop-types */
import React, { useEffect, useState, useContext } from 'react';
import Alert from '@material-ui/lab/Alert';
import {
  Box,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  TextField,
  Typography,
  Snackbar,
} from '@material-ui/core';
import * as Yup from 'yup';
import { Formik } from 'formik';
import { ChangeDuenoPacient } from '../../api/pacient';
import { TokenContext } from '../../lib/context/contextToken';
import { GetUsers } from '../../api/users';

const CambiarDueno = ({ IdPacient, setActualizarPacient }) => {
  const { token } = useContext(TokenContext);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [SearchEmail, setSearchEmail] = useState('');
  const [User, setUser] = useState([]);
  const [feedback, setFeedback] = useState({
    type: '',
    content: '',
  });

  useEffect(() => {
    setLoading(true);

    try {
      const fetchUser = async () => {
        const { users } = await (await GetUsers(token)).data;
        setUser(users);
        setLoading(false);
      };

      fetchUser();
    } catch (error) {
      console.log(error.message);
      setLoading(false);
    }
  }, []);

  return (
    <>
      <Formik
        initialValues={{
          email: ''
        }}
        validationSchema={
              Yup.object().shape({
                email: Yup.string().email().max(100).required('Las opciones son requeridos'),
              })
            }
        onSubmit={(values, actions) => {
          setTimeout(async () => {
            console.log(values);

            try {
              await ChangeDuenoPacient(token, IdPacient, values.email);
              setFeedback({
                type: 'success',
                content: 'Se registro el seguimiento.',
              });

              setActualizarPacient(true);
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
          handleBlur,
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
                Cambio de dueño
              </Typography>
              <Typography
                color="textSecondary"
                gutterBottom
                variant="body2"
              >
                Escriba la direccion de correo del nuevo dueño
              </Typography>
            </Box>
            <TextField
              fullWidth
              margin="normal"
              onChange={(event) => setSearchEmail(event.target.value)}
              variant="outlined"
              placeholder="Busca direcciones como: ejemplo@gmail.com"
            />
            {loading ? 'Cargando...' : (
              <FormControl style={{ width: 200, marginBottom: 10 }}>
                <InputLabel id="demo-simple-select-label">Direcciones</InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  name="email"
                  id="demo-simple-select"
                  onBlur={handleBlur}
                  onChange={handleChange}
                >
                  {User.filter((item) => item.email.toLowerCase().includes(SearchEmail.toLowerCase())).map((user) => (
                    <MenuItem value={user.email}>{user.email}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <Box my={2}>
              <Button
                color="primary"
                disabled={isSubmitting}
                fullWidth
                size="large"
                type="submit"
                variant="contained"
              >
                Cambiar
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

export default CambiarDueno;
