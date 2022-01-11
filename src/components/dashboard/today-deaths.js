import React, { useEffect, useState } from "react";
import { Avatar, Box, Card, CardContent, Grid, Typography } from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import MoneyIcon from '@mui/icons-material/Money';

export function TodayDeaths (props) {
  const [todayDeaths, setTodayDeaths] = useState("");
  useEffect(() => {
    fetch("https://disease.sh/v3/covid-19/all")
      .then((res) => res.json())
      .then((data) => {
        setTodayDeaths(data.todayDeaths);
      });
  }, []);
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
            TODAY DEATHS
          </Typography>
          <Typography
            color="textPrimary"
            variant="h4"
          >
            {todayDeaths}
          </Typography>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
)};
