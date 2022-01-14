import React, { useEffect, useState } from "react";
import { Avatar, Box, Card, CardContent, Grid, Typography } from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { toNiceNumber } from "src/utils/toNiceNumber";

export function Deaths (props) {
  
  return(
  <Card
    sx={{ height: '100%' }}
    {...props}
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
            DEATHS
          </Typography>
          <Typography
            color="textPrimary"
            variant="h4"
          >
            {toNiceNumber(props.deaths)}
          </Typography>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
)};
