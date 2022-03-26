import Head from 'next/head';
import { Box, Container } from '@mui/material';
import { ReportListResults } from '../components/reports/reports-list-results';
import { CustomerListToolbar } from '../components/customer/customer-list-toolbar';
import { DashboardLayout } from '../components/dashboard-layout';
import { reports } from '../__mocks__/reports';
import React, { useReducer, useState } from 'react';
import api from '../utils/api';
import { useEffect } from 'react';

const ReportList = (props) => {

  const [userReports,setUserReports] = useState([])

  useEffect (() => {

    console.log("Im here")
    console.log(props.nivu)

    const token = localStorage.getItem('token');
    console.log(token);

    api.get(
      `users/1/reports`, {headers: {
        'Authorization': `bearer ${token}` 
      }})
        .then(res => {
        console.log(res.data);
        setUserReports(res.data);
    })

  }, [])
  return (
  <>
    <Head>
      <title>
        Customers | KGXperience
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
          <ReportListResults reports={userReports} />
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
