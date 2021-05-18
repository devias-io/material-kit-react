/* eslint-disable max-len */
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
  const [Loading, setLoading] = useState(false);
  const [pacient, setPacient] = useState([]);
  const [actualizarPacient, setActualizarPacient] = useState(false);
  const [searchPacient, setSearchPacient] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);

      try {
        const { users } = await (await GetPacients(token)).data;

        setPacient(users);
        setLoading(false);
      } catch (error) {
        console.log(error.message);
        setLoading(false);
      }
    };

    fetchUsers();

    actualizarPacient && setActualizarPacient(false);
  }, [actualizarPacient]);

  return (
    <Page
      className={classes.root}
      title="Pacientes"
    >
      <Container maxWidth={false}>
        {Loading && pacient.length === 0 ? 'Cargando...' : (
          <>
            <Toolbar setActualizarPacient={setActualizarPacient} setSearchPacient={setSearchPacient} />
            <Box mt={3}>
              <Results pacient={pacient} searchPacient={searchPacient} setActualizarPacient={setActualizarPacient} />
            </Box>
          </>
        )}
      </Container>
    </Page>
  );
};

export default CustomerListView;
