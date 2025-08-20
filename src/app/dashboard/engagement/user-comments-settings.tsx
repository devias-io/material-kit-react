'use client';

import * as React from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';

export function UserCommentsSettings(): React.JSX.Element {
  return (
    <Card>
      <CardHeader subheader="Configure user interaction settings" title="User Comments" />
      <Divider />
      <CardContent>
        <FormGroup>
          <FormControlLabel control={<Checkbox defaultChecked />} label="Enable comments on posts" />
          <FormControlLabel control={<Checkbox />} label="Require manual approval for new comments" />
          <FormControlLabel control={<Checkbox defaultChecked />} label="Send email notification on new comment" />
        </FormGroup>
      </CardContent>
      <Divider />
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <Button variant="contained">Save settings</Button>
      </CardActions>
    </Card>
  );
}