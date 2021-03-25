import { useState } from 'react';
import { Helmet } from 'react-helmet';
import {
  Box,
  Container,
  makeStyles
} from '@material-ui/core';
import Results from './Results';
import Toolbar from './Toolbar';
import data from './data';

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.default,
    minHeight: '100%',
    paddingBottom: theme.spacing(3),
    paddingTop: theme.spacing(3)
  }
}));

const CustomerListView = () => {
  const classes = useStyles();
  const [customers] = useState(data);

  return (
    <>
      <Helmet>
        <title>Customers</title>
      </Helmet>
      <Box className={classes.root}>
        <Container maxWidth={false}>
          <Toolbar />
          <Box sx={{ mt: 3 }}>
            <Results customers={customers} />
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default CustomerListView;
