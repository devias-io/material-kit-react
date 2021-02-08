import React, { useState } from 'react';
import Cookies from 'js-cookie';
import {
  Box,
  Button,
  Container,
  Grid,
  makeStyles
} from '@material-ui/core';
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

  const loginGoogle = () => {
    setLoading(true);

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
          window.location.href = '/app/dashboard';
        })
        .catch((error) => console.log(error.message));
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log(error.message);
    }
  };

  return (
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
                Login with Google
              </Button>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Page>
  );
};

export default LoginView;
