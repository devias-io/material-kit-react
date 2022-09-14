import { useEffect, useRef, useState } from 'react';
import Router from 'next/router';
import NextLink from 'next/link';
import { Box, CircularProgress, Typography } from '@mui/material';
import { Logo } from '../../components/logo';
import { useAuthContext } from '../../contexts/auth-context';
import { auth, ENABLE_AUTH } from '../../lib/auth';

const parseUrl = () => {
  // Get the token from the page URL hash (without #)
  const hash = window.location.hash.substring(1);
  const token = hash.split('=')[1];

  return { token };
};

const Page = () => {
  const authContext = useAuthContext();
  const confirmed = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const confirm = async () => {
    // Prevent from calling twice in development mode with React.StrictMode enabled
    if (confirmed.current) {
      return;
    }

    confirmed.current = true;

    // Check if authentication with Zalter is enabled
    if (!ENABLE_AUTH) {
      setError('Zalter authentication not enabled');
      setIsLoading(false);
      return;
    }

    // Extract the token from the page URL
    const { token } = parseUrl();

    // Token missing, redirect to home
    if (!token) {
      Router
        .push('/')
        .catch(console.error);
      return;
    }

    try {
      // This can be call inside AuthProvider component, but we do it here for simplicity
      await auth.signInWithLink('finalize', { token });

      // Get the user from your database
      const user = {};

      // Update Auth Context state
      authContext.signIn(user);

      // Redirect to home page
      Router
        .push('/')
        .catch(console.error);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    confirm().catch(console.error);
  }, []);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          p: 3
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          p: 3
        }}
      >
        <Box sx={{ p: 3 }}>
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
        <Typography
          sx={{ mb: 1 }}
          variant="h4"
        >
          Oops!
        </Typography>
        <Typography variant="body2">
          {error}
        </Typography>
      </Box>
    );
  }

  return null;
};

export default Page;
