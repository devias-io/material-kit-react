'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';

export function MaintenanceModeCard(): React.JSX.Element {
  return (
    <Card>
      <CardHeader subheader="Control site access for visitors" title="Maintenance Mode" />
      <CardContent>
        <Stack spacing={2}>
          <Alert severity="warning" variant="outlined">
            Enabling maintenance mode will make the site inaccessible to regular visitors.
          </Alert>
          <FormControlLabel control={<Switch />} label="Enable Maintenance Mode" />
        </Stack>
      </CardContent>
      <Divider />
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <Button color="error" variant="contained">
          Update Status
        </Button>
      </CardActions>
    </Card>
  );
}