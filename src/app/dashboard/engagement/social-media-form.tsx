'use client';

import * as React from 'react';
import { FacebookLogo as FacebookLogoIcon } from '@phosphor-icons/react/dist/ssr/FacebookLogo';
import { InstagramLogo as InstagramLogoIcon } from '@phosphor-icons/react/dist/ssr/InstagramLogo';
import { TwitterLogo as TwitterLogoIcon } from '@phosphor-icons/react/dist/ssr/TwitterLogo';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';

export function SocialMediaForm(): React.JSX.Element {
  return (
    <Card>
      <CardHeader subheader="Link your social media profiles" title="Social Media" />
      <Divider />
      <CardContent>
        <Stack spacing={2}>
          <FormControl>
            <InputLabel>Twitter</InputLabel>
            <OutlinedInput
              label="Twitter"
              name="twitter"
              startAdornment={
                <InputAdornment position="start">
                  <TwitterLogoIcon />
                </InputAdornment>
              }
            />
          </FormControl>
          <FormControl>
            <InputLabel>Facebook</InputLabel>
            <OutlinedInput
              label="Facebook"
              name="facebook"
              startAdornment={
                <InputAdornment position="start">
                  <FacebookLogoIcon />
                </InputAdornment>
              }
            />
          </FormControl>
          <FormControl>
            <InputLabel>Instagram</InputLabel>
            <OutlinedInput
              label="Instagram"
              name="instagram"
              startAdornment={
                <InputAdornment position="start">
                  <InstagramLogoIcon />
                </InputAdornment>
              }
            />
          </FormControl>
        </Stack>
      </CardContent>
      <Divider />
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <Button variant="contained">Save links</Button>
      </CardActions>
    </Card>
  );
}