import Head from 'next/head';
import { Box, Container, Grid, Typography } from '@mui/material';
import { AccountProfile } from '../components/account/account-profile';
import {UserReports} from "../components/reports/user-reports"
import { DashboardLayout } from '../components/dashboard-layout';
import { useEffect } from 'react';
import axios from 'axios';
import React, { useState } from 'react';

const Account = () => {

  const [firstName, setfirstName] = useState("");

  useEffect (() => {

    console.log("Im here")

    const token = localStorage.getItem('token');
    console.log(token);

    axios.get(
      ``, {headers: {
        'Authorization': `bearer ${token}` 
      }})
        .then(res => {
        console.log(res);
        console.log(res.data);  
        setfirstName(res.data.full_name);
        console.log("#######", firstName);
    })

  })

  return (
  <>
    <Head>
      <title>
        Account | Material Kit
      </title>
    </Head>
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        py: 8
      }}
    >
      <Container maxWidth="lg">
        <Typography
          sx={{ mb: 3 }}
          variant="h4"
        >
          Add Report
        </Typography>
        <Grid
          container
          spacing={3}
        >
      
          <Grid
            item
            lg={18}
            md={6}
            xs={12}
          >
            <UserReports/>
          </Grid>
        </Grid>
      </Container>
    </Box>
  </>
)
}

Account.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default Account;
