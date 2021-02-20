/* eslint-disable no-unused-expressions */
import React from 'react';
import {
  Box,
  Container,
  makeStyles
} from '@material-ui/core';
import Calendar from 'react-awesome-calendar';
import Page from 'src/components/Page';
import Toolbar from './Toolbar';

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.dark,
    minHeight: '100%',
    paddingBottom: theme.spacing(3),
    paddingTop: theme.spacing(3)
  }
}));

const events = [{
  id: 1,
  color: '#fd3153',
  from: '2019-05-02T18:00:00+00:00',
  to: '2019-05-05T19:00:00+00:00',
  title: 'This is an event'
}, {
  id: 2,
  color: '#1ccb9e',
  from: '2019-05-01T13:00:00+00:00',
  to: '2019-05-05T14:00:00+00:00',
  title: 'This is another event'
}, {
  id: 3,
  color: '#3694DF',
  from: '2019-05-05T13:00:00+00:00',
  to: '2019-05-05T20:00:00+00:00',
  title: 'This is also another event'
}];

const CalendarView = () => {
  const classes = useStyles();

  return (
    <Page
      className={classes.root}
      title="Calendario"
    >
      <Container maxWidth={false}>
        <Toolbar />
        <Box mt={3}>
          <Calendar
            events={events}
          />
        </Box>
      </Container>
    </Page>
  );
};

export default CalendarView;
