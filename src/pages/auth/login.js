import React from 'react';
import NextLink from 'next/link';
import { useCallback, useState } from 'react';
import { useAuth } from 'src/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Alert,
  Button,
  TextField,
  Typography,
  Box,
  Link,
  CssBaseline,
  Container,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';


const theme = createTheme({
  palette: {
    primary: {
      main: '#ffffff',
    },
    secondary: {
      main: '#ffffff',
    },
  },
});

const Page = () => {
  const router = useRouter();
  const auth = useAuth();
  const [method, setMethod] = useState('email');
  const formik = useFormik({
    initialValues: {
      email: 'Fintech80@queensu.ca',
      password: 'Fintechadmin!',
      submit: null
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
    onSubmit: async (values, helpers) => {
      try {
        await auth.signIn(values.email, values.password);
        router.push('/dashboard');
      } catch (err) {
        helpers.setStatus({ success: false });
        helpers.setErrors({ submit: err.message });
        helpers.setSubmitting(false);
      }
    }
  });

  const handleMethodChange = useCallback(
    (event, value) => {
      setMethod(value);
    },
    []
  );

  const handleSkip = useCallback(
    () => {
      auth.skip();
      router.push('/dashboard');
    },
    [auth, router]
  );

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            bgcolor: 'primary.main',
            height: '100vh',
            justifyContent: 'center',
            color: '#000000', // Black text color
          }}
        >
          <div className="logo" style={{ position: 'absolute', top: 0, left: 0, padding: '20px', fontWeight: 'bold', fontSize: '24px' }}>
            PathFinder
          </div>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold' }}>
            Welcome back
          </Typography>
          <Box component="form" onSubmit={formik.handleSubmit} noValidate sx={{ width: '100%', mt: 1 }}>
            <TextField
              error={!!(formik.touched.email && formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              onChange={formik.handleChange}
              value={formik.values.email}
              sx={{
                bgcolor: 'secondary.main',
                borderRadius: 4,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#000000', // Black border color
                  },
                  '&:hover fieldset': {
                    borderColor: '#000000', // Black border color on hover
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#000000', // Black border color when focused
                  },
                },
              }}
            />
            <TextField
              error={!!(formik.touched.password && formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              variant="outlined"
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              onChange={formik.handleChange}
              value={formik.values.password}
              sx={{
                bgcolor: 'secondary.main',
                borderRadius: 4,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#000000',
                  },
                  '&:hover fieldset': {
                    borderColor: '#000000',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#000000',
                  },
                },
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                mt: 3, 
                mb: 2, 
                bgcolor: '#f8c24c', 
                color: '#000000',
                '&:hover': {
                  bgcolor: '#e6c301', // Light grey on hover
                }
              }}
            >
              Sign In
            </Button>
            <Button
                  fullWidth
                  variant="contained"
                  size="small"
                  sx={{ 
                    mt: 1, 
                    mb: 1, 
                    bgcolor: '#f8c24c', 
                    color: '#000000',
                    '&:hover': {
                      bgcolor: '#e6c301', // Light grey on hover
                    }
                  }}
                  onClick={handleSkip}
                >
                  Skip authentication
            </Button>
            <Typography
                color="#000000"
                variant="body2"
              >
                Don&apos;t have an account?
                &nbsp;
                <Link
                  component={NextLink}
                  href="/auth/register"
                  underline="hover"
                  variant="subtitle2"
                  sx={{ color: '#000000' }}  // Black color
                >
                  Register
                </Link>
              </Typography>
            <Alert
                  color="primary"
                  severity="info"
                  sx={{ mt: 3 }}
                >
                  <div>
                    You can use <b>Fintech80@queensu.ca</b> and password <b>Fintechadmin!</b>
                  </div>
                </Alert>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default Page;