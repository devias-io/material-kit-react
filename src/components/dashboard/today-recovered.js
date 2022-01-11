import React, { useEffect, useState } from "react";
import { Avatar, Box, Card, CardContent, Grid, Typography } from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

export function TodayRecovered (props) {
  const [todayRecovered, setTodayRecovered] = useState("");
  useEffect(() => {
    fetch("https://disease.sh/v3/covid-19/all")
      .then((res) => res.json())
      .then((data) => {
        setTodayRecovered(data.todayRecovered);
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
            TODAY RECOVERED
          </Typography>
          <Typography
            color="textPrimary"
            variant="h4"
          >
            {todayRecovered}
          </Typography>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
)};
