import Head from 'next/head';
import { Box, Container, Grid, Typography } from '@mui/material';
import { AccountProfile } from '../components/account/account-profile';
import {UserReports} from "../components/reports/user-reports"
import { DashboardLayout } from '../components/dashboard-layout';
import { useEffect } from 'react';
import api from '../utils/api';
import React, { useState } from 'react';

const Account = () => {

  const [userId, setUserId] = useState(null);

  const getData = (values) => {
    console.log(values)

    api.post(
      `users/${userId}/report`,values)
        .then(res => {
        console.log(res);
        console.log(res.data);  
    })
  }

  useEffect (() => {

    console.log("Im here")

    const user = localStorage.getItem('user');
    setUserId(JSON.parse(user).user_id);


  }, [])

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
            <UserReports getData={getData}/>
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
