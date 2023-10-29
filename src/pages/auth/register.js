import React from 'react';
import Link from 'next/link'; 
import { useAuth } from 'src/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Alert,
  Box,
  Button,
  TextField,
  Typography,
  CssBaseline,
  Container,
  ThemeProvider,
  createTheme
} from '@mui/material';

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
      const formik = useFormik({
        initialValues: {
          email: 'Fintech80SignUp@gmail.com',
          name: 'Test1',
          password: 'Fintechadmin',
          confirmPassword: 'Fintechadmin',
          submit: null
        },
        validationSchema: Yup.object({
          email: Yup
            .string()
            .email('Must be a valid email')
            .max(255)
            .required('Email is required'),
          name: Yup
            .string()
            .max(255)
            .required('Name is required'),
          password: Yup
            .string()
            .max(255)
            .required('Password is required')
        }),
    onSubmit: async (values, helpers) => {
      try {
        await auth.signUp(values.email, values.name, values.password);
        router.push('/');
      } catch (err) {
        helpers.setStatus({ success: false });
        helpers.setErrors({ submit: err.message });
        helpers.setSubmitting(false);
      }
    }
  });

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
            Sign Up
          </Typography>
          <Box component="form" onSubmit={formik.handleSubmit} noValidate sx={{ width: '100%', mt: 1 }}>
            <TextField
              error={!!(formik.touched.name && formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="name"
              label="Name"
              name="name"
              autoFocus
              onChange={formik.handleChange}
              value={formik.values.name}
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
              onChange={formik.handleChange}
              value={formik.values.email}
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
              autoComplete="new-password"
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
            <TextField
              error={!!(formik.touched.confirmPassword && formik.errors.confirmPassword)}
              helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
              variant="outlined"
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              onChange={formik.handleChange}
              value={formik.values.confirmPassword}
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
                  bgcolor: '#e6c301',
                }
              }}
            >
              Sign Up
            </Button>
            <Typography
                color="#000000"
                variant="body2"
              >
                Already have an account?
                &nbsp;
                <Link
                  component={Link}
                  href="/auth/login"
                  underline="hover"
                  variant="subtitle2"
                  sx={{ color: '#000000' }}  // Black color
                >
                  Sign in
                </Link>
              </Typography>
              <Alert
                  color="primary"
                  severity="info"
                  sx={{ mt: 3 }}
                >
                  <div>
                    You can use <b>Fintech80SignUp@queensu.ca</b>, name <b>Test1</b> and password <b>Fintechadmin!</b>
                  </div>
                </Alert>
         </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default Page;
