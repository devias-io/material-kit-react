import React, { useEffect, useState } from "react";
import { Avatar, Box, Card, CardContent, Grid, Typography } from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

export function Deaths (props) {
  const [deaths, setDeaths] = useState("");
  useEffect(() => {
    fetch("https://disease.sh/v3/covid-19/all")
      .then((res) => res.json())
      .then((data) => {
        setDeaths(data.deaths);
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
            DEATHS
          </Typography>
          <Typography
            color="textPrimary"
            variant="h4"
          >
            {deaths}
          </Typography>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
)};
