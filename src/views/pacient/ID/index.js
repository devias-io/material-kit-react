/* eslint-disable no-unused-expressions */
import React from 'react';
import {
  Box,
  Container,
  makeStyles
} from '@material-ui/core';
import { useParams } from 'react-router-dom';
import Page from 'src/components/Page';

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.dark,
    minHeight: '100%',
    paddingBottom: theme.spacing(3),
    paddingTop: theme.spacing(3)
  }
}));

const PacientView = () => {
  const classes = useStyles();
  const idPacient = useParams();

  console.log(idPacient.idPacient);

  return (
    <Page
      className={classes.root}
      title="Paciente"
    >
      <Container maxWidth={false}>
        rtghtrgtr
        <Box mt={3}>
          grregefg
        </Box>
      </Container>
    </Page>
  );
};

export default PacientView;
