'use client';

import * as React from 'react';
import { Upload as UploadIcon } from '@phosphor-icons/react/dist/ssr/Upload';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

export function MediaUploadCard(): React.JSX.Element {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <Card>
        <CardHeader subheader="Upload and manage media assets" title="Media Upload" />
        <Divider />
        <CardContent>
          <Stack spacing={3}>
            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'var(--mui-palette-divider)',
                borderRadius: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 3,
                textAlign: 'center',
                bgcolor: 'var(--mui-palette-background-level1)',
              }}
            >
              <UploadIcon size={32} />
              <Typography variant="h6" sx={{ mt: 1 }}>
                Select a file
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Drag and drop a file here or click the button below
              </Typography>
              <Button component="label" variant="contained" sx={{ mt: 2 }}>
                Browse File
                <VisuallyHiddenInput type="file" />
              </Button>
            </Box>
          </Stack>
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-end' }}>
          <Button variant="contained">Upload</Button>
        </CardActions>
      </Card>
    </form>
  );
}