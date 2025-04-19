'use client';

import * as React from 'react';

import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useUser } from '@/hooks/use-user';

export function AccountInfo(): React.JSX.Element {
  const { user } = useUser();

  // Handle case where user might not be loaded yet
  if (!user) {
    return (
      <Card>
        <CardContent>
          <Typography>Loading user information...</Typography>
        </CardContent>
      </Card>
    );
  }

  // Construct full name from firstName and lastName
  const fullName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.firstName || 'Unknown User';

  // Handle location information with type safety
  const city = typeof user.city === 'string' ? user.city : '';
  const country = typeof user.country === 'string' ? user.country : '';
  const location = [city, country].filter(Boolean).join(' ');

  // Safely handle email
  const email = typeof user.email === 'string' ? user.email : '';

  return (
    <Card>
      <CardContent>
        <Stack spacing={2} sx={{ alignItems: 'center' }}>
          <div>
            <Avatar src={user.avatar || '/assets/avatar.png'} sx={{ height: '80px', width: '80px' }} />
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
