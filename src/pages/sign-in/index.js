import { useState } from 'react';
import Head from 'next/head';
import NextLink from 'next/link';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Box, Button, FormHelperText, Grid, Tab, Tabs, TextField, Typography } from '@mui/material';
import { auth, ENABLE_AUTH } from '../../lib/auth';
import { Logo } from '../../components/logo';
import { useAuthContext } from '../../contexts/auth-context';
import Router from 'next/router';

const Page = () => {
  const [tab, setTab] = useState('email');
  const [emailSent, setEmailSent] = useState(false);
  const authContext = useAuthContext();
  const formik = useFormik({
    initialValues: {
      email: '',
      submit: null
    },
    validationSchema: Yup.object({
      email: Yup
        .string()
        .email('Must be a valid email')
        .max(255)
        .required('Email is required')
    }),
    onSubmit: async (values, helpers) => {
      if (!ENABLE_AUTH) {
        helpers.setFieldError('submit', 'Zalter authentication not enabled');
        helpers.setSubmitting(false);
        return;
      }

      try {
        // When in development, this will be 'http://localhost:3000/sign-in/confirm'
        // Remember to configure it in your project settings
        const redirectUri = window.location.href + '/confirm';

        // This can be call inside AuthProvider component, but we do it here for simplicity
        await auth.signInWithLink('start', {
          email: values.email,
          redirectUri
        });
        helpers.setSubmitting(false);
        setEmailSent(true);
      } catch (err) {
        console.error(err);
        helpers.setFieldError('submit', err.message || 'Something went wrong');
        helpers.setSubmitting(false);
      }
    }
  });

  const handleTabChange = (event, value) => {
    setTab(value);
  };

  const handleRetry = () => {
    setEmailSent(false);
  };

  const handleSkip = () => {
    // Since skip is requested, we set a fake user as authenticated
    const user = {};

    // Update Auth Context state
    authContext.signIn(user);

    // Persist the skip for AuthProvider initialize call
    globalThis.sessionStorage.setItem('skip-auth', 'true');

    // Redirect to home page
    Router
      .push('/')
      .catch(console.error);
  };

  return (
    <>
      <Head>
        <title>Sign in | Material Kit</title>
      </Head>
      <Box
        component="main"
        sx={{
          display: 'flex',
          flex: '1 1 auto'
        }}
      >
        <Grid
          container
          sx={{ flex: '1 1 auto' }}
        >
          <Grid
            item
            xs={12}
            lg={6}
            sx={{
              backgroundColor: 'neutral.50',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                p: 3
              }}
            >
              <NextLink
                href="/"
                passHref
              >
                <a>
                  <Logo
                    sx={{
                      height: 42,
                      width: 42
                    }}
                  />
                </a>
              </NextLink>
            </Box>
            <Box
              sx={{
                flex: '1 1 auto',
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <Box
                sx={{
                  maxWidth: 500,
                  px: 3,
                  py: '100px',
                  width: '100%'
                }}
              >
                {emailSent ? (
                  <div>
                    <Typography
                      sx={{ mb: 1 }}
                      variant="h4"
                    >
                      Confirm your email
                    </Typography>
                    <Typography>
                      We emailed a magic link to&nbsp;
                      <Box
                        component="span"
                        sx={{
                          color: 'primary.main'
                        }}
                      >
                        {formik.values.email}
                      </Box>
                      <br />
                      Click the link to to log in.
                    </Typography>
                    <Box
                      sx={{
                        alignItems: 'center',
                        display: 'flex',
                        gap: 3,
                        mt: 3
                      }}
                    >
                      <Typography
                        color="text.secondary"
                        variant="body2"
                      >
                        Wrong email?
                      </Typography>
                      <Button
                        color="inherit"
                        onClick={handleRetry}
                      >
                        Use a different email
                      </Button>
                    </Box>
                  </div>
                ) : (
                  <div>
                    <Typography
                      sx={{ mb: 1 }}
                      variant="h4"
                    >
                      Welcome
                    </Typography>
                    <Typography
                      color="text.secondary"
                      sx={{ mb: 3 }}
                      variant="body2"
                    >
                      Sign up on the internal platform
                    </Typography>
                    <Tabs
                      onChange={handleTabChange}
                      sx={{ mb: 3 }}
                      value={tab}
                    >
                      <Tab
                        label="Email"
                        value="email"
                      />
                      <Tab
                        label="Phone Number"
                        value="phoneNumber"
                      />
                    </Tabs>
                    {tab === 'email' && (
                      <div>
                        <TextField
                          error={Boolean(formik.touched.email && formik.errors.email)}
                          fullWidth
                          helperText={formik.touched.email && formik.errors.email}
                          label="Email Address"
                          name="email"
                          onBlur={formik.handleBlur}
                          onChange={formik.handleChange}
                          type="email"
                          value={formik.values.email}
                          variant="outlined"
                        />
                        <FormHelperText sx={{ mt: 1 }}>
                          Enter a valid email since this is a fully integrated authentication system. Optionally you can skip.
                        </FormHelperText>
                        {formik.errors.submit && (
                          <Typography
                            color="error"
                            sx={{ mt: 2 }}
                            variant="body2"
                          >
                            {formik.errors.submit}
                          </Typography>
                        )}
                        <Button
                          fullWidth
                          size="large"
                          sx={{ mt: 3 }}
                          onClick={() => formik.handleSubmit()}
                          variant="contained"
                        >
                          Continue
                        </Button>
                        <Button
                          fullWidth
                          size="large"
                          sx={{ mt: 3 }}
                          onClick={handleSkip}
                        >
                          Skip authentication
                        </Button>
                      </div>
                    )}
                    {tab === 'phoneNumber' && (
                      <div>
                        <Typography
                          sx={{ mb: 1 }}
                          variant="h6"
                        >
                          Not available in the demo
                        </Typography>
                        <Typography color="text.secondary">
                          Zalter Identity does support SMS passcodes, but to prevent unnecessary costs we disabled this feature in the demo.
                        </Typography>
                      </div>
                    )}
                  </div>
                )}
              </Box>
            </Box>
          </Grid>
          <Grid
            item
            xs={12}
            lg={6}
            sx={{
              alignItems: 'center',
              background: 'radial-gradient(50% 50% at 50% 50%, #122647 0%, #090E23 100%)',
              color: 'white',
              display: 'flex',
              justifyContent: 'center',
              '& img': {
                maxWidth: '100%'
              }
            }}
          >
            <Box sx={{ p: 3 }}>
              <Typography
                align="center"
                color="inherit"
                sx={{
                  fontSize: '24px',
                  lineHeight: '32px',
                  mb: 1
                }}
                variant="h1"
              >
                Authentication sponsored by&nbsp;
                <Box
                  component="a"
                  href="https://zalter.com?ref=devias-mk-react"
                  sx={{ color: '#15B79E' }}
                  target="_blank"
                >
                  zalter.com
                </Box>
              </Typography>
              <Typography
                align="center"
                sx={{ mb: 3 }}
                variant="subtitle1"
              >
                Create secure, seamless user experiences with Zalter Passwordless Authentication.
              </Typography>
              <img
                alt=""
                src="/static/images/sign-in-illustration.svg"
              />
            </Box>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default Page;
