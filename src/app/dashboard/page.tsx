'use client';

import Grid from '@mui/material/Grid';
import { config } from '@/config';

// Component imports
import { TotalCustomers } from './overview/total-customers';
import { TotalProfit } from './overview/total-profit';
import { TodaysDonation } from './overview/todays-donation';
import { PrashadOrders } from './overview/prashad-orders';
import { Sales } from './overview/sales';
import { Traffic } from './overview/traffic';
import { LatestOrders } from './overview/latest-orders';

export default function Page(): JSX.Element {
  return (
    <Grid
      container
      spacing={3}
      sx={{
        width: '100%',
        minHeight: '100vh',
        p: 3,
        boxSizing: 'border-box',
      }}
    >
      {/* Stat Cards - wider */}
      <Grid item lg={6} sm={12} xs={12}>
        <TotalCustomers value="100+" />
      </Grid>
      <Grid item lg={6} sm={12} xs={12}>
        <TotalProfit value="₹5,00,000" />
      </Grid>
      <Grid item lg={6} sm={12} xs={12}>
        <TodaysDonation value="₹5,00,000" />
      </Grid>
      <Grid item lg={6} sm={12} xs={12}>
        <PrashadOrders value="25+" />
      </Grid>

      {/* Charts Row - take more space */}
      <Grid item xs={12}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={9}>
            <Sales
              chartSeries={[
                { name: 'This year', data: [18, 16, 5, 8, 3, 14, 14, 16, 17, 19, 18, 20] },
              ]}
              sx={{ height: 450, width: '100%' }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Traffic
              chartSeries={[63, 15, 22]}
              labels={['Donation', 'Puja Booking', 'Prashad']}
              sx={{ height: 450, width: '100%' }}
            />
          </Grid>
        </Grid>
      </Grid>

      {/* Table - full width */}
      <Grid item xs={12}>
        <LatestOrders />
      </Grid>
    </Grid>
  );
}