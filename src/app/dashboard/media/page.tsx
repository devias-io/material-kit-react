'use client';

import * as React from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { MediaUploadCard } from '@/app/dashboard/media/media-upload-card';

export default function MediaPage(): React.JSX.Element {
  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h4">Media</Typography>
      </div>
      <MediaUploadCard />
    </Stack>
  );
}