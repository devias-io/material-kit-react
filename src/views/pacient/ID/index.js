/* eslint-disable camelcase */
/* eslint-disable no-unused-expressions */
import React, { useEffect, useState, useContext } from 'react';
import {
  Box,
  Container,
  makeStyles
} from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import Accordion from '@material-ui/core/Accordion';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import { useParams } from 'react-router-dom';
import Page from 'src/components/Page';
import Calendar from 'react-awesome-calendar';
import { GetPacient } from '../../../api/pacient';
import { GetVacunasByTipos } from '../../../api/vacunas';
import { TokenContext } from '../../../lib/context/contextToken';

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.dark,
    minHeight: '100%',
    paddingBottom: theme.spacing(3),
    paddingTop: theme.spacing(3)
  }
}));

const PacientView = () => {
  const { token } = useContext(TokenContext);
  const [Pacient, setPacient] = useState();
  const [MisVacuas, setMisVacunas] = useState([]);
  const classes = useStyles();
  const idPacient = useParams();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  useEffect(() => {
    try {
      const fetchPacient = async () => {
        const { pacient } = await (await GetPacient(token, idPacient.idPacient)).data;

        const { vacunas } = await (await GetVacunasByTipos(token, pacient.tipo)).data;
        setMisVacunas(vacunas);

        setPacient(pacient);
        setLoading(false);
      };

      idPacient.idPacient && fetchPacient();
    } catch (error) {
      console.log(error.message);
      setLoading(false);
    }
  }, [idPacient]);

  const events = [{
    id: 1,
    color: '#fd3153',
    from: '2021-01-02T18:00:00+00:00',
    to: '2019-05-05T19:00:00+00:00',
    title: 'This is an event'
  }, {
    id: 2,
    color: '#1ccb9e',
    from: '2021-01-01T13:00:00+00:00',
    to: '2019-05-05T14:00:00+00:00',
    title: 'This is another event'
  }, {
    id: 3,
    color: '#3694DF',
    from: '2021-05-05T13:00:00+00:00',
    to: '2019-05-05T20:00:00+00:00',
    title: 'This is also another event'
  }];

  const calendario_tipo_pacient = (tipo) => {
    switch (tipo) {
      case 'Perro':
        return <img src="/static/images/calendar/calendario-vacunación-perros.webp" alt="calendario para perros" />;
      case 'Gato':
        return <img src="/static/images/calendar/calendario-vacunacion-gatos.png" alt="calendario para perros" />;
      default:
        return 'NONE';
    }
  };

  return (
    <Page
      className={classes.root}
      title="Paciente"
    >
      <Container maxWidth={false}>
        <Box mt={3}>
          {loading ? (
            <h2>Cargando....</h2>
          ) : (
            <>
              <Accordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="panel1bh-content"
                  id="panel1bh-header"
                >
                  <Typography className={classes.heading}>
                    Calendario actual para proximas vacunas de
                    {' '}
                    <strong>{Pacient.nombre}</strong>
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Calendar
                    events={events}
                  />
                </AccordionDetails>
              </Accordion>

              <Accordion expanded={expanded === 'panel2'} onChange={handleChange('panel2')}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="panel1bh-content"
                  id="panel1bh-header"
                >
                  <Typography className={classes.heading}>
                    Vacunas de
                    {' '}
                    <strong>{Pacient.nombre}</strong>
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  Mis vacunas
                  {' '}
                  {MisVacuas.length}
                </AccordionDetails>
              </Accordion>

              <Accordion expanded={expanded === 'panel3'} onChange={handleChange('panel3')}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="panel1bh-content"
                  id="panel1bh-header"
                >
                  <Typography className={classes.heading}>
                    Calendario de
                    {' '}
                    <strong>{Pacient.tipo}</strong>
                    {' '}
                    para vacunas
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {calendario_tipo_pacient(Pacient.tipo)}
                </AccordionDetails>
              </Accordion>
            </>
          )}
        </Box>
      </Container>
    </Page>
  );
};

export default PacientView;
