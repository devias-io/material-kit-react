import { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Box, Container } from '@material-ui/core';
import Results from './Results';
import Toolbar from './Toolbar';
import data from './data';

const CustomerListView = () => {
  const [customers] = useState(data);

  return (
    <>
      <Helmet>
        <title>Customers</title>
      </Helmet>
      <Box
        sx={{
          backgroundColor: 'background.default',
          minHeight: '100%',
          py: 3
        }}
      >
        <Container maxWidth={false}>
          <Toolbar />
          <Box sx={{ pt: 3 }}>
            <Results customers={customers} />
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default CustomerListView;
