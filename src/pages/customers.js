import Head from 'next/head';
import { Box, Container } from '@mui/material';
import { CustomerListResults } from '../components/customer/customer-list-results';
import { CustomerListToolbar } from '../components/customer/customer-list-toolbar';
import { DashboardLayout } from '../components/dashboard-layout';
import { customers } from '../__mocks__/customers';
import React, { useState } from 'react';
import axios from 'axios';
import { useEffect } from 'react';
const Customers = () => {
  const [firstName, setfirstName] = useState("");

  useEffect (() => {

    console.log("Im here")

    const token = localStorage.getItem('token');
    console.log(token);

    axios.get(
      `https://c3d8-2409-4072-6e99-d8fb-3f81-3fe9-a9-ad56.ngrok.io/users/me/`, {headers: {
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
        Customers | Material Kit
      </title>
    </Head>
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        py: 8
      }}
    >
      <Container maxWidth={false}>
        <CustomerListToolbar />
        <Box sx={{ mt: 3 }}>
          <CustomerListResults customers={customers} />
        </Box>
      </Container>
    </Box>
  </>
  );
}

Customers.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default Customers;
