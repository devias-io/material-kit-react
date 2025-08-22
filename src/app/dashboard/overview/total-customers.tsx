import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Users as UsersIcon } from '@phosphor-icons/react/dist/ssr/Users';
import type { SxProps } from '@mui/material/styles';

export interface TotalCustomersProps {
  diff?: number;
  trend?: 'up' | 'down';
  sx?: SxProps;
  value: string;
}

export function TotalCustomers({ diff, trend, sx, value }: TotalCustomersProps): React.JSX.Element {
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
          spacing={2}
        >
          <Avatar
            sx={{
              backgroundColor: 'var(--mui-palette-success-main)',
              height: 120,
              width: 120,
            }}
          >
            <UsersIcon />
          </Avatar>
          <Typography color="text.secondary" variant="h6">
            No. of Registrations
          </Typography>
          <Typography variant="h2">{value}</Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}