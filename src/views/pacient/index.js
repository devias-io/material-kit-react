/* eslint-disable no-unused-expressions */
import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Container,
  makeStyles
} from '@material-ui/core';
import Page from 'src/components/Page';
import { TokenContext } from '../../lib/context/contextToken';
import Results from './Results';
import Toolbar from './Toolbar';
import { GetPacients } from '../../api/pacient';

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.dark,
    minHeight: '100%',
    paddingBottom: theme.spacing(3),
    paddingTop: theme.spacing(3)
  }
}));

const CustomerListView = () => {
  const { token } = useContext(TokenContext);
  const classes = useStyles();
  const [pacient, setPacient] = useState([]);
  const [actualizarPacient, setActualizarPacient] = useState(false);
  const [searchPacient, setSearchPacient] = useState('');

  useEffect(() => {
    try {
      const fetchUsers = async () => {
        const { users } = await (await GetPacients(token)).data;
        setPacient(users);
      };

      fetchUsers();

      actualizarPacient && setActualizarPacient(false);
    } catch (error) {
      console.log(error.message);
    }
  }, [actualizarPacient]);

  return (
    <Page
      className={classes.root}
      title="Pacientes"
    >
      <Container maxWidth={false}>
        <Toolbar setActualizarPacient={setActualizarPacient} setSearchPacient={setSearchPacient} />
        <Box mt={3}>
          <Results pacient={pacient} searchPacient={searchPacient} />
        </Box>
      </Container>
    </Page>
  );
};

export default CustomerListView;
