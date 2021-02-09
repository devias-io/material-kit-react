/* eslint-disable max-len */
/* eslint-disable no-unused-expressions */
import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Container,
  makeStyles
} from '@material-ui/core';
import Page from 'src/components/Page';
import { TokenContext } from '../../../lib/context/contextToken';
import Results from './Results';
import Toolbar from './Toolbar';
import { GetUsers } from '../../../api/users';

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.dark,
    minHeight: '100%',
    paddingBottom: theme.spacing(3),
    paddingTop: theme.spacing(3)
  }
}));

const PacientListView = () => {
  const { token } = useContext(TokenContext);
  const classes = useStyles();
  const [customers, setCustomers] = useState([]);
  const [actualizarUser, setActualizarUser] = useState(false);
  const [searchUser, setSearchUser] = useState('');

  useEffect(() => {
    try {
      const fetchUsers = async () => {
        const { users } = await (await GetUsers(token)).data;
        setCustomers(users);
      };

      fetchUsers();

      actualizarUser && setActualizarUser(false);
    } catch (error) {
      console.log(error.message);
    }
  }, [actualizarUser]);

  return (
    <Page
      className={classes.root}
      title="Clientes"
    >
      <Container maxWidth={false}>
        <Toolbar setActualizarUser={setActualizarUser} setSearchUser={setSearchUser} />
        <Box mt={3}>
          <Results customers={customers} searchUser={searchUser} setActualizarUser={setActualizarUser} />
        </Box>
      </Container>
    </Page>
  );
};

export default PacientListView;
