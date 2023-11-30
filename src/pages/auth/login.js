import { useCallback, useState } from 'react';
import Head from 'next/head';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Cookies from 'js-cookie';
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { SignInUseCase } from 'src/provider/useCases/auth/auth.usecase';
import Image from 'next/image';
import Logo from '../../assets/images/RealizzaLogo.png'
import { useEffect } from 'react';

const loginSchema = Yup.object().shape({
  email: Yup.string().email('Must be a valid email').max(255).required('Email is required'),
  password: Yup.string().max(255).required('Password is required')
});


const Page = () => {
  const router = useRouter();
  const [method, setMethod] = useState('email');
  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
       await SignInUseCase({
        ...values,
        email: values.email,
        password: values.password,
      }).then((response) => {
        if (response.error) {
          return formik.setErrors({ submit: response.error });
        } 
        
        Cookies.set('token', response.token);
        window.sessionStorage.setItem('authenticated', 'true');
      });
    }
  });

  useEffect(() => {
    if (window.sessionStorage.getItem('authenticated') === 'true') {
      router.push('/');
    }
  });

  return (
    <>
      <Head>
        <title>
          Login | Realizza Backoffice
        </title>
      </Head>
      <header>
        <Image
          src={Logo}
          alt="Realizza Logo"
          width={100}
          height={80}
        />
      </header>
      <Box
        sx={{
          backgroundColor: 'background.paper',
          flex: '1 1 auto',
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <Box
          sx={{
            maxWidth: 550,
            px: 3,
            py: '100px',
            width: '100%'
          }}
        >
          <div>
            <Stack
              spacing={1}
              sx={{ mb: 3 }}
            >
              <Typography variant="h4">
                Painel Backoffice
              </Typography>
            </Stack>
            {method === 'email' && (
              <form
                noValidate
                onSubmit={formik.handleSubmit}
              >
                <Stack spacing={3}>
                  <TextField
                    error={!!(formik.touched.email && formik.errors.email)}
                    fullWidth
                    helperText={formik.touched.email && formik.errors.email}
                    label="Email Address"
                    name="email"
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    type="email"
                    value={formik.values.email}
                  />
                  <TextField
                    error={!!(formik.touched.password && formik.errors.password)}
                    fullWidth
                    helperText={formik.touched.password && formik.errors.password}
                    label="Password"
                    name="password"
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    type="password"
                    value={formik.values.password}
                  />
                </Stack>
                {formik.errors.submit && (
                  <Typography
                    color="error"
                    sx={{ mt: 3 }}
                    variant="body2"
                  >
                    {formik.errors.submit}
                  </Typography>
                )}
                <Button
                  fullWidth
                  size="large"
                  sx={{ mt: 3 }}
                  type="submit"
                  variant="contained"
                >
                  Continue
                </Button>
              </form>
            )}
          </div>
        </Box>
      </Box>
    </>
  );
};


export default Page;
