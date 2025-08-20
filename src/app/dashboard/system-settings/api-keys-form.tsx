'use client';

import * as React from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';

export function ApiKeysForm(): React.JSX.Element {
  return (
    <Card>
      <CardHeader subheader="Manage API keys for third-party integrations" title="API Keys" />
      <Divider />
      <CardContent>
        <Stack spacing={2} sx={{ maxWidth: 'sm' }}>
          <FormControl fullWidth>
            <InputLabel>Google Maps API Key</InputLabel>
            <OutlinedInput label="Google Maps API Key" name="googleMapsKey" />
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Stripe API Key</InputLabel>
            <OutlinedInput label="Stripe API Key" name="stripeKey" type="password" />
          </FormControl>
        </Stack>
      </CardContent>
      <Divider />
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <Button variant="contained">Save Keys</Button>
      </CardActions>
    </Card>
  );
}