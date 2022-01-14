import React, { useEffect, useState } from "react";
import { Avatar, Box, Card, CardContent, Grid, Typography } from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { toNiceNumber } from "src/utils/toNiceNumber";

export function TodayRecovered (props) {
  const {todayRecovered} = props
  return(
  <Card
    sx={{ height: '100%' }}
  >
    <CardContent>
      <Grid
        container
        spacing={3}
        sx={{ justifyContent: 'space-between' }}
      >
        <Grid item>
          <Typography
            color="textSecondary"
            gutterBottom
            variant="overline"
          >
            TODAY RECOVERED
          </Typography>
          <Typography
            color="textPrimary"
            variant="h4"
          >
            {toNiceNumber(todayRecovered)}
          </Typography>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
)};
