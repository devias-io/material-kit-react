import Head from 'next/head';
import { Box, Container, Grid, Typography } from '@mui/material';
import { AccountProfile } from '../components/account/account-profile';
import { AccountProfileDetails } from '../components/account/account-profile-details';
import { DashboardLayout } from '../components/dashboard-layout';
import { useEffect } from 'react';
import api from '../utils/api';
import React, { useState } from 'react';

const Account = () => {

  const [fullName, setFullname] = useState("");
  const [email,setEmail] = useState("")

  useEffect (() => {

    console.log("Im here")

    const token = localStorage.getItem('token');
    console.log(token);

    api.get(
      `users/me/`, {headers: {
        'Authorization': `bearer ${token}` 
      }})
        .then(res => {
        console.log(res);
        console.log(res.data);  
        setFullname(res.data.full_name);
        setEmail(res.data.email)
        console.log("#######", fullName);
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
          Account
        </Typography>
        <Grid
          container
          spacing={3}
        >
          <Grid
            item
            lg={4}
            md={6}
            xs={12}
          >
            <AccountProfile name={fullName} email={email} />
          </Grid>
          <Grid
            item
            lg={8}
            md={6}
            xs={12}
          >
            <AccountProfileDetails name={fullName} email={email} />
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
