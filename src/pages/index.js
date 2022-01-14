import Head from 'next/head';
import { Box, Container, Grid } from '@mui/material';
import { Cases } from '../components/dashboard/cases';
import { LatestOrders } from '../components/dashboard/latest-orders';
import { LatestProducts } from '../components/dashboard/countryChart';
import { Sales } from '../components/dashboard/sales';
import { TodayCases } from '../components/dashboard/today-cases';
import { Deaths } from 'src/components/dashboard/deaths';
import { Recovered } from '../components/dashboard/recovered';
import { TodayRecovered } from '../components/dashboard/today-recovered';
import { DashboardLayout } from '../components/dashboard-layout';
import { Active } from 'src/components/dashboard/active';
import { TodayDeaths } from 'src/components/dashboard/today-deaths';
import { Critical } from 'src/components/dashboard/critical';
import React, { useEffect, useState } from "react";
import CountryPicker from 'src/components/dashboard/countryPicker';
import { CountryChart } from '../components/dashboard/countryChart';
import { pickersDayClasses } from '@mui/lab';

const Dashboard = () => {
  const [data, setData] = useState(null)
  const [countriesList, setCountriesList] = useState([]);
  const [countryData, setCountryData] = useState(null)
  const [picked, setPicked] = useState(false)

  const fetchCountry = async (country) => {
    
    await fetch(`https://disease.sh/v3/covid-19/countries/${country}`)
      .then((res) => res.json())
      .then((data) => {
        setCountryData(data);
      });
  }

  useEffect(async () => {
    await fetch("https://disease.sh/v3/covid-19/all")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
      });
  }, [])

  useEffect(async () => {
    await fetch("https://disease.sh/v3/covid-19/countries")
      .then((res) => res.json())
      .then((data) => {
        setCountriesList(data);
      });
  }, [])


  const handleCountryChange =  (country) => {
     fetchCountry(country)
     setPicked(true)
  }

  return (
  <>
    <Head>
      <title>
        Covid-19 Dashboard 
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
        <Grid
          container
          spacing={3}
        >
          <Grid
            item
            lg={3}
            sm={6}
            xl={3}
            xs={12}
          >
            <Cases cases={data?.cases}/>
          </Grid>
          <Grid
            item
            xl={3}
            lg={3}
            sm={6}
            xs={12}
          >
            <Recovered recovered={data?.recovered}/>
          </Grid>
          <Grid
            item
            xl={3}
            lg={3}
            sm={6}
            xs={12}
          >
            <Deaths deaths={data?.deaths}/>
          </Grid>
          <Grid
            item
            xl={3}
            lg={3}
            sm={6}
            xs={12}
          >
            <Active active={data?.active} sx={{ height: '100%' }} />
          </Grid>
          <Grid
            item
            xl={3}
            lg={3}
            sm={6}
            xs={12}
          >
            <TodayCases todayCases={data?.todayCases}/>
          </Grid>
          <Grid
            item
            xl={3}
            lg={3}
            sm={6}
            xs={12}
          >
            <TodayRecovered todayRecovered={data?.todayRecovered} />
          </Grid>
          <Grid
            item
            lg={3}
            sm={6}
            xl={3}
            xs={12}
          >
            <TodayDeaths todayDeaths={data?.todayDeaths}/>
          </Grid>
          <Grid
            item
            xl={3}
            lg={3}
            sm={6}
            xs={12}
          >
            <Critical critical={data?.critical}/>
          </Grid>
          <Grid
            item
            lg={12}
            md={12}
            xl={12}
            xs={12}
          >
            <CountryPicker countriesList={countriesList} handleCountryChange={handleCountryChange}/>
          </Grid>
          <Grid
            item
            lg={12}
            md={12}
            xl={12}
            xs={12}
          >
            <CountryChart picked={picked} countryData={countryData}  />
          </Grid>
          
        </Grid>
      </Container>
    </Box>
  </>
  )
    };

Dashboard.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default Dashboard;
