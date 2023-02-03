import Head from 'next/head';
import NextLink from 'next/link';
import Router from 'next/router';
import { Formik, useFormik } from 'formik';
import * as Yup from 'yup';
import { Box, Button, Container, Grid, Link, TextField, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const Login = () => {
  const formik = useFormik({
    initialValues: {
      email: 'Email address',
      password: ''
    },
    validationSchema: Yup.object({
      email: Yup
        .string()
        .email('Must be a valid email')
        .max(255)
        .required('Email is required'),
      password: Yup
        .string()
        .max(255)
        .required('Password is required')
    }),
    onSubmit: async (values) => {
      await fetch('https://api.platform-20.com:3000/api/user/login', {
        method: 'POST',
        body: {
          email: values.email,
          password: values.password
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(function (response) {
        console.log(response)
        return response.json()
      }).then(function (response) {
        if(response.user) {
          // set the username in local storage
          localStorage.setItem('username', response.user.name);
          // set the account status in local storage
          localStorage.setItem('accountStatus', response.user.role);
          // set account subscription
          localStorage.setItem('accountSubscription', response.user.subscription);
          // set account subscription status
          localStorage.setItem('accountSubscriptionStatus', response.user.subscriptionStatus);
          // set account subscription expiration
          localStorage.setItem('accountSubscriptionExpiration', response.user.subscriptionEndDate);
          // set account email
          localStorage.setItem('accountEmail', response.user.email);

          Router.push('/');
      }
      if(response.twoFA === true) {
        localStorage.setItem('twoFA', true);
        openAuthPopup(response.message);
        // do not continue
        return;
    }
      }).catch(function (error) {
        console.log(error)
      })
    }
  });

  return (
    <>
      <Head>
        <title>Login | Platform-20</title>
      </Head>
      <ProtectedRoute
  exact
  path="/"
  component={page}>
      </ProtectedRoute>
      <Box
        component="main"
        sx={{
          alignItems: 'center',
          display: 'flex',
          flexGrow: 1,
          minHeight: '100%'
        }}
      >
        <Container maxWidth="sm">
          <NextLink
            href="/"
            passHref
          >
            <Button
              component="a"
              startIcon={<ArrowBackIcon fontSize="small" />}
            >
              Dashboard
            </Button>
          </NextLink>
          <form onSubmit={formik.handleSubmit}>
            <Box sx={{ my: 3 }}>
              <Typography
                color="textPrimary"
                variant="h4"
              >
                Sign in
              </Typography>
              <Typography
                color="textSecondary"
                gutterBottom
                variant="body2"
              >
                Sign in on the internal platform
              </Typography>
            </Box>
            <Grid
              container
              spacing={3}
            >
              <Grid
                item
                xs={12}
                md={6}
              >
              </Grid>
              <Grid
                item
                xs={12}
                md={6}
              >
              </Grid>
            </Grid>
            <Box
              sx={{
                pb: 1,
                pt: 3
              }}
            >
              <Typography
                align="center"
                color="textSecondary"
                variant="body1"
              >
                Login with email address
              </Typography>
            </Box>
            <TextField
              error={Boolean(formik.touched.email && formik.errors.email)}
              fullWidth
              helperText={formik.touched.email && formik.errors.email}
              label="Email Address"
              margin="normal"
              name="email"
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
              type="email"
              value={formik.values.email}
              variant="outlined"
            />
            <TextField
              error={Boolean(formik.touched.password && formik.errors.password)}
              fullWidth
              helperText={formik.touched.password && formik.errors.password}
              label="Password"
              margin="normal"
              name="password"
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
              type="password"
              value={formik.values.password}
              variant="outlined"
            />

            <Typography>
              <Button
                color="secondary"
                component="a"
                href="https://portal.platform-20.com"
                variant="body2"
              >
                Forgot password?
              </Button>
            </Typography>

            
            <Box sx={{ py: 2 }}>
              <Button
                color="primary"
                disabled={formik.isSubmitting}
                fullWidth
                size="large"
                type="submit"
                variant="contained"
              >
                Sign In Now
              </Button>
            </Box>
          </form>
        </Container>
      </Box>
    </>
  );
};

export default Login;
