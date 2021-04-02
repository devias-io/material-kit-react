/* eslint-disable react/prop-types */
/* eslint-disable react-hooks/rules-of-hooks */
import React, { useContext, useState } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import * as Yup from 'yup';
import { Formik } from 'formik';
import Alert from '@material-ui/lab/Alert';
import {
  Box,
  Button,
  Card,
  CardContent,
  Snackbar,
  CardHeader,
  Divider,
  Grid,
  TextField,
  makeStyles
} from '@material-ui/core';
import { TokenContext } from '../lib/context/contextToken';
import { UpdateUser } from '../api/users';

const useStyles = makeStyles(() => ({
  root: {}
}));

const UpdateFormUser = ({
  user, setActualizarUser, className, ...rest
}) => {
  const classes = useStyles();

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
          Phone: 0,
          cedula: '',
        }}
        validationSchema={
              Yup.object().shape({
                email: Yup.string().email('Must be a valid email').max(100),
                userName: Yup.string().max(100),
                Phone: Yup.string().max(10),
                cedula: Yup.string().max(10),
              })
            }
        onSubmit={(values, actions) => {
          setTimeout(async () => {
            if (values.email) {
              user.email = values.email;
            }

            if (values.Cedula) {
              user.Cedula = values.Cedula;
            }

            if (values.userName) {
              user.userName = values.userName;
            }

            if (values.Phone) {
              user.Phone = values.Phone;
            }

            try {
              await UpdateUser(token, user, user.idUser);
              setFeedback({
                type: 'success',
                content: 'Se actualizo el usuario.',
              });

              setActualizarUser(true);
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
          <form
            onSubmit={handleSubmit}
            autoComplete="off"
            noValidate
            className={clsx(classes.root, className)}
            {...rest}
          >
            <Card>
              <CardHeader
                subheader="Esta informacion es editable"
                title="Perfil"
              />
              <Divider />
              <CardContent>
                <Grid
                  container
                  spacing={3}
                >
                  <Grid
                    item
                    md={6}
                    xs={12}
                  >
                    <TextField
                      error={Boolean(touched.userName && errors.userName)}
                      helperText={touched.userName && errors.userName}
                      fullWidth
                      name="userName"
                      onChange={handleChange}
                      required
                      onBlur={handleBlur}
                      variant="outlined"
                      placeholder={user.userName || 'User Name'}
                    />
                  </Grid>
                  <Grid
                    item
                    md={6}
                    xs={12}
                  >
                    <TextField
                      fullWidth
                      disabled
                      value={user.created_at}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid
                    item
                    md={6}
                    xs={12}
                  >
                    <TextField
                      error={Boolean(touched.email && errors.email)}
                      helperText={touched.email && errors.email}
                      fullWidth
                      name="email"
                      required
                      onBlur={handleBlur}
                      variant="outlined"
                      onChange={handleChange}
                      placeholder={user.email || 'Email'}
                    />
                  </Grid>
                  <Grid
                    item
                    md={6}
                    xs={12}
                  >
                    <TextField
                      error={Boolean(touched.Phone && errors.Phone)}
                      helperText={touched.Phone && errors.Phone}
                      fullWidth
                      name="Phone"
                      onBlur={handleBlur}
                      type="number"
                      onChange={handleChange}
                      variant="outlined"
                      placeholder={user.Phone || 'Phone'}
                    />
                  </Grid>
                  <Grid
                    item
                    md={6}
                    xs={12}
                  >
                    <TextField
                      error={Boolean(touched.cedula && errors.cedula)}
                      helperText={touched.cedula && errors.cedula}
                      fullWidth
                      name="cedula"
                      onBlur={handleBlur}
                      type="number"
                      onChange={handleChange}
                      variant="outlined"
                      placeholder={user.cedula || 'Numero de identificacion'}
                    />
                  </Grid>
                </Grid>
              </CardContent>
              <Divider />
              <Box
                display="flex"
                justifyContent="flex-end"
                p={2}
              >
                <Button
                  color="primary"
                  disabled={isSubmitting}
                  fullWidth
                  size="large"
                  type="submit"
                  variant="contained"
                >
                  Actualizar datos
                </Button>
              </Box>
            </Card>
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

UpdateFormUser.propTypes = {
  className: PropTypes.string
};

export default UpdateFormUser;
