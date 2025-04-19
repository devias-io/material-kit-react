'use client';

import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useAuth } from '@/lib/auth/client';

export function AccountInfo(): React.JSX.Element {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Stack spacing={2} sx={{ alignItems: 'center' }}>
            <CircularProgress />
            <Typography>Loading user information...</Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (!currentUser) {
    return (
      <Card>
        <CardContent>
          <Typography>No user information available</Typography>
        </CardContent>
      </Card>
    );
  }

  // Construct full name from firstName and lastName
  const fullName =
    currentUser.firstName && currentUser.lastName
      ? `${currentUser.firstName} ${currentUser.lastName}`
      : currentUser.firstName || 'Unknown User';

  // Handle location information with type safety
  // Note: The current User type in auth-client doesn't include city/country
  // Using empty strings as placeholders since they aren't in the User interface
  const city = '';
  const country = '';
  const location = [city, country].filter(Boolean).join(' ');

  // Safely handle email
  const email = currentUser.email || '';

  return (
    <Card>
      <CardContent>
        <Stack spacing={2} sx={{ alignItems: 'center' }}>
          <div>
            <Avatar src={currentUser.avatar || '/assets/avatar.png'} sx={{ height: '80px', width: '80px' }} />
          </div>
          <Stack spacing={1} sx={{ textAlign: 'center' }}>
            <Typography variant="h5">{fullName}</Typography>
            {location && (
              <Typography color="text.secondary" variant="body2">
                {location}
              </Typography>
            )}
            {email && (
              <Typography color="text.secondary" variant="body2">
                {email}
              </Typography>
            )}
          </Stack>
        </Stack>
      </CardContent>
      <Divider />
      <CardActions>
        <Button fullWidth variant="text">
          Upload picture
        </Button>
      </CardActions>
    </Card>
  );
}
