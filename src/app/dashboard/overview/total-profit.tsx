'use client';
import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { CurrencyInr as CurrencyInrIcon } from '@phosphor-icons/react/dist/ssr/CurrencyInr';
import type { SxProps } from '@mui/material/styles';

export interface TotalProfitProps {
  sx?: SxProps;
  value: string;
}

export function TotalProfit({ sx, value }: TotalProfitProps): React.JSX.Element {
  return (
    <Card
      sx={{
        width: 340,   // set fixed width
        height: 300,  // same as width → makes it square
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
              backgroundColor: 'var(--mui-palette-primary-main)',
              height: 120,
              width: 120,
            }}
          >
            <CurrencyInrIcon />
          </Avatar>
          <Typography color="text.secondary" variant="h6">
            Total Donations
          </Typography>
          <Typography variant="h2">{value}</Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}