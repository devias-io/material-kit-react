import Head from 'next/head';
import { Box, Container } from '@mui/material';
import { ReportListResults } from '../components/reports/reports-list-results';
import { ReportListToolbar } from '../components/reports/report-list-toolbar';
import { DashboardLayout } from '../components/dashboard-layout';
import { reports } from '../__mocks__/reports';
import React, { useReducer, useState } from 'react';
import api from '../utils/api';
import { useEffect } from 'react';

const ReportList = (props) => {

  const [userReports,setUserReports] = useState([])
  const [userId, setUserId] = useState(null);

  useEffect (() => {

    console.log("Im here")
    console.log(props.nivu)

    const token = localStorage.getItem('token');
    console.log(token);

    const user = localStorage.getItem('user');
    setUserId(JSON.parse(user).user_id);

    console.log(userId)
    if(userId != null){
      api.get(
        `users/${userId}/reports`, {headers: {
          'Authorization': `bearer ${token}` 
        }})
          .then(res => {
          console.log(res.data);
          setUserReports(res.data);
      })
    }


  }, [userId])

  return (
  <>
    <Head>
      <title>
        Reports | KGXperience
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
        <ReportListToolbar />
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
