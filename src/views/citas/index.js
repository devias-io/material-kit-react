/* eslint-disable max-len */
/* eslint-disable no-unused-expressions */
import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Container,
  Grid,
  makeStyles
} from '@material-ui/core';
import Page from 'src/components/Page';
import { useSelector } from 'react-redux';
import Calendar from 'react-awesome-calendar';
import { TokenContext } from '../../lib/context/contextToken';
import Results from './Results';
import Toolbar from './Toolbar';
import { GetCitas, GetCalendarCitas } from '../../api/citas';

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.dark,
    minHeight: '100%',
    paddingBottom: theme.spacing(3),
    paddingTop: theme.spacing(3)
  }
}));

const CitasView = () => {
  const { token } = useContext(TokenContext);
  const { me } = useSelector((state) => state.Sesion);
  const classes = useStyles();
  const [Citas, setCitas] = useState([]);
  const [CalendarCitas, setCalendarCitas] = useState([]);
  const [actualizarCitas, setActualizarCitas] = useState(false);

  useEffect(() => {
    try {
      const fetchUsers = async () => {
        const { MisCitas } = await (await GetCitas(token)).data;
        setCitas(MisCitas);

        const { MiCalendar } = await (await GetCalendarCitas(token)).data;
        console.log(MiCalendar);
        setCalendarCitas(MiCalendar);
      };

      fetchUsers();

      actualizarCitas && setActualizarCitas(false);
    } catch (error) {
      console.log(error.message);
    }
  }, [actualizarCitas]);

  return (
    <Page
      className={classes.root}
      title="Citas"
    >
      <Container maxWidth={false}>
        {me.isAdmin === 0 ? (
          <Toolbar setActualizarCitas={setActualizarCitas} />
        ) : ''}
        <Box mt={3}>
          <Grid container spacing={1} direction="row">
            <Grid item xs={12} md={3}>
              <Results Citas={Citas} setActualizarCitas={setActualizarCitas} />
            </Grid>
            <Grid item xs={12} md={9}>
              <Calendar
                events={CalendarCitas}
              />
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Page>
  );
};

export default CitasView;
