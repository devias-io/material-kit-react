'use client';

import * as React from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { SocialMediaForm } from '@/app/dashboard/engagement/social-media-form';
import { UserCommentsSettings } from '@/app/dashboard/engagement/user-comments-settings';

export default function EngagementPage(): React.JSX.Element {
  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h4">Engagement</Typography>
      </div>
      <form onSubmit={(event) => event.preventDefault()}>
        <Stack spacing={3}>
          <SocialMediaForm />
          <UserCommentsSettings />
        </Stack>
      </form>
    </Stack>
  );
}