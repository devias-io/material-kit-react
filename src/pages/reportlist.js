import Head from 'next/head';
import { Box, Container } from '@mui/material';
import { ReportListResults } from '../components/customer/reports-list-results';
import { CustomerListToolbar } from '../components/customer/customer-list-toolbar';
import { DashboardLayout } from '../components/dashboard-layout';
import { reports } from '../__mocks__/customers';
import React, { useReducer, useState } from 'react';
import axios from 'axios';
import { useEffect } from 'react';
const ReportList = () => {
  const [id,setId] = useState(0)
  const [userReports,setUserReports] = useState({})
  // useEffect (() => {

  //   console.log("Im here")

  //   const token = localStorage.getItem('token');
  //   console.log(token);

  //   // axios.get(
  //   //   `https://5952-103-224-35-112.ngrok.io/users/me/`, {headers: {
  //   //     'Authorization': `bearer ${token}` 
  //   //   }})
  //   //     .then(res => {
  //   //     console.log(res);
  //   //     setId(id)
  //   // })
    
  //   // axios.get(
  //   //   `https://5952-103-224-35-112.ngrok.io/users/${2}/reports`)
  //   //     .then(res => {
  //   //       setUserReports(res.data)
  //   //     console.log(res);
  //   // })


  // })
  // console.log("@@@@@@@@@@@@@@@@@@@@@@@@",userReports)
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
          <ReportListResults reports={reports} />
        </Box>
      </Container>
    </Box>
  </>
  );
}

ReportList.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default ReportList;
