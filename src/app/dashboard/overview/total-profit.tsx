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
    <Card sx={sx}>
      <CardContent>
        <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }} spacing={3}>
          <Stack spacing={1}>
            <Typography color="text.secondary" variant="overline">
              Total Donations
            </Typography>
            <Typography variant="h4">{value}</Typography>
          </Stack>
          <Avatar sx={{ backgroundColor: 'var(--mui-palette-primary-main)', height: '56px', width: '56px' }}>
            <CurrencyInrIcon />
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
}