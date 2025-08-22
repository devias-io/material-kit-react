'use client';
import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ListChecks as ListChecksIcon } from '@phosphor-icons/react/dist/ssr/ListChecks';
import type { SxProps } from '@mui/material/styles';

export interface PrashadOrdersProps {
  sx?: SxProps;
  value: string;
  size?: number; // optional prop to set square size
}

export function PrashadOrders({ sx, value, size = 150 }: PrashadOrdersProps): React.JSX.Element {
  return (
    <Card
       sx={{
        width: 340,   // fixed width
        height: 300,  // fixed height → makes it square
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...sx,
      }}
    >
      <CardContent sx={{ width: '100%', height: '100%' }}>
        <Stack
          direction="column"
          sx={{ alignItems: 'center', justifyContent: 'center', height: '100%' }}
          spacing={1} // Reduced spacing to make it more compact like the image
        >
          <Avatar sx={{ backgroundColor: 'var(--mui-palette-warning-main)', height: '120px', width: '120px' }}>
            <ListChecksIcon />
          </Avatar>
          <Typography
            color="text.secondary"
            variant="h6"
            sx={{ textAlign: 'center' }} // This is the key change
          >
            Prashad Orders
          </Typography>
          <Typography variant="h2">{value}</Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}