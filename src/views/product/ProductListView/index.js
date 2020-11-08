/* eslint-disable */
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { Box, Container, Grid, makeStyles } from '@material-ui/core';
import { Pagination } from '@material-ui/lab';
import Page from 'src/components/Page';

import Toolbar from './Toolbar';
import EventCard from './EventCard';
import * as eventAPI from '../../../store/actions/events';

const useStyles = makeStyles(theme => ({
  root: {
    backgroundColor: theme.palette.background.dark,
    minHeight: '100%',
    paddingBottom: theme.spacing(3),
    paddingTop: theme.spacing(3)
  },
  productCard: {
    height: '100%'
  }
}));

const ProductList = props => {
  const classes = useStyles();

  useEffect(() => {
    props.fetchEvents();
  }, []);

  return (
    <Page className={classes.root} title="Products">
      <Container maxWidth={false}>
        <Toolbar />
        <Box mt={3}>
          <Grid container spacing={3}>
            {props.events.map((event, i) => (
              <Grid item key={i} lg={4} md={6} xs={12}>
                <EventCard data={event} />
              </Grid>
            ))}
          </Grid>
        </Box>
        <Box mt={3} display="flex" justifyContent="center">
          <Pagination color="primary" count={3} size="small" />
        </Box>
      </Container>
    </Page>
  );
};

const mapState = state => ({
  events: state.events
});
const mapDispatch = {
  ...eventAPI
};
const connector = connect(mapState, mapDispatch);

export default connector(ProductList);
