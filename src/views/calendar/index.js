/* eslint-disable max-len */
/* eslint-disable no-unused-expressions */
import React from 'react';
import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import {
  Box,
  Container,
  makeStyles
} from '@material-ui/core';
import Calendar from 'react-awesome-calendar';
import Page from 'src/components/Page';

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.dark,
    minHeight: '100%',
    paddingBottom: theme.spacing(3),
    paddingTop: theme.spacing(3)
  },
  heading: {
    fontSize: theme.typography.pxToRem(15),
    flexBasis: '33.33%',
    flexShrink: 0,
  },
  secondaryHeading: {
    fontSize: theme.typography.pxToRem(15),
    color: theme.palette.text.secondary,
  },
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
  const [expanded, setExpanded] = React.useState(false);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Page
      className={classes.root}
      title="Calendario"
    >
      <Container maxWidth={false}>
        <Box mt={3}>
          <Accordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel1bh-content"
              id="panel1bh-header"
            >
              <Typography className={classes.heading}>Mi Calendario para vacunas</Typography>
              <Typography className={classes.secondaryHeading}>Ver todas las vacunas de mis pacientes</Typography>
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
              <Typography className={classes.heading}>Calendario de vacunas para perros</Typography>
              <Typography className={classes.secondaryHeading}>Ver calendario solo para perros</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <img src="/static/images/calendar/calendario-vacunación-perros.webp" alt="calendario para perros" />
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expanded === 'panel3'} onChange={handleChange('panel3')}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel1bh-content"
              id="panel1bh-header"
            >
              <Typography className={classes.heading}>Calendario de vacunas para gatos</Typography>
              <Typography className={classes.secondaryHeading}>Ver calendario solo para gatos</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <img src="/static/images/calendar/calendario-vacunacion-gatos.png" alt="calendario para perros" />
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expanded === 'panel4'} onChange={handleChange('panel4')}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel1bh-content"
              id="panel1bh-header"
            >
              <Typography className={classes.heading}>Calendario de vacunas para conejos</Typography>
              <Typography className={classes.secondaryHeading}>Ver vacunas solo para conejos</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <strong>Mixomastosis</strong>
              <ul>
                <li>Primera Vacuna: 8 semanas de edad</li>
                <li>Segunda Vacuna: 12 semanas de edad</li>
                <li>Frecuencia: Una vez al año</li>
                <li>Época: Un año después de la última vacuna de mixomatosis administrada.</li>
              </ul>

              <br />

              <strong>Fiebre hemorragica</strong>
              <ul>
                <li>Primera Vacuna: 10 semanas de edad</li>
                <li>Segunda Vacuna: 14 semanas de edad</li>
                <li>Frecuencia: Una vez al año</li>
                <li>Época: Un año después de la última vacuna de fiebre hemorrágica administrada.</li>
              </ul>
            </AccordionDetails>
          </Accordion>
        </Box>
      </Container>
    </Page>
  );
};

export default CalendarView;
