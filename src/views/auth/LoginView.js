import React, { useState } from 'react';
import Cookies from 'js-cookie';
import {
  Box,
  Button,
  Snackbar,
  Container,
  Grid,
  makeStyles
} from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import FacebookIcon from 'src/icons/Facebook';
import GoogleIcon from 'src/icons/Google';
import { useDispatch } from 'react-redux';
import Page from 'src/components/Page';
import { LoginUser } from '../../api/users';
import { SetSesion } from '../../lib/redux/me';
import { loginWithGoogle } from '../../utils/firebase';

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.dark,
    height: '100%',
    paddingBottom: theme.spacing(3),
    paddingTop: theme.spacing(3)
  }
}));

const LoginView = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const classes = useStyles();
  const [visible, setVisible] = useState(false);
  const [feedback, setFeedback] = useState({
    type: '',
    content: '',
  });

  const loginGoogle = () => {
    setLoading(true);
    setVisible(true);

    setFeedback({
      type: 'info',
      content: 'Este acceso es solo para personas autorizadas o con mascotas registradas.'
    });

    try {
      loginWithGoogle()
        .then(async (user) => {
          const GoogleMe = {
            email: user.email,
            avatar: user.photoURL,
            userName: user.displayName,
            provider: 'google',
          };

          const responseLogin = await LoginUser(GoogleMe);
          Cookies.set('access-token', responseLogin.data.me.token);
          dispatch(SetSesion(GoogleMe));
          window.location.href = '/app/pacient';
        }).catch((error) => {
          setLoading(false);
          setVisible(true);
          setFeedback({
            type: 'error',
            content: error.message
          });
        });
    } catch (error) {
      setLoading(false);
      setVisible(true);
      setFeedback({
        type: 'error',
        content: error.message
      });
    }
  };

  return (
    <>
      <Page
        className={classes.root}
        title="Login"
      >
        {loading}
        <Box
          display="flex"
          flexDirection="column"
          height="100%"
          justifyContent="center"
        >
          <Container maxWidth="sm">
            <Grid
              container
              spacing={3}
            >
              <Grid
                item
                xs={12}
                md={6}
              >
                <Button
                  color="primary"
                  fullWidth
                  startIcon={<FacebookIcon />}
                  onClick={() => false}
                  size="large"
                  variant="contained"
                >
                  Login with Facebook
                </Button>
              </Grid>
              <Grid
                item
                xs={12}
                md={6}
              >
                <Button
                  fullWidth
                  startIcon={<GoogleIcon />}
                  onClick={loginGoogle}
                  size="large"
                  variant="contained"
                >
                  {loading ? 'Cargando...' : 'Entrar con Google'}
                </Button>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Page>

      <Snackbar open={visible} autoHideDuration={6000} onClose={() => setVisible(false)}>
        <Alert onClose={() => setVisible(false)} severity={feedback.type}>
          {feedback.content}
        </Alert>
      </Snackbar>
    </>
  );
};

export default LoginView;
