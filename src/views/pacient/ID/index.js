/* eslint-disable no-use-before-define */
/* eslint-disable max-len */
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
import { GetVacunasByTipos, GetCalendarVacunas, GetVacunasHistory } from '../../../api/vacunas';
import { getSeguimiento } from '../../../api/seguimiento';
import { GetUserByPacient } from '../../../api/users';
import TableMisVacunas from './table-mis-vacunas';
import { TokenContext } from '../../../lib/context/contextToken';
import Toolbar from './Toolbar';
import HistorialClinico from './historial-clinico';

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
  const [MyCalendario, setCalendario] = useState([]);
  const [User, setUser] = useState([]);
  const [HistoryVacunas, setHistoryVacunas] = useState([]);
  const [Seguimiento, setSeguimiento] = useState([]);
  const classes = useStyles();
  const idPacient = useParams();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ActualizarCalendario, setActualizarCalendario] = useState(false);
  const [ActualizarSeguimiento, setActualizarSeguimiento] = useState(false);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  useEffect(() => {
    try {
      const fetchPacient = async () => {
        setLoading(true);

        const { pacient } = await (await GetPacient(token, idPacient.idPacient)).data;
        setPacient(pacient);

        const { vacunas } = await (await GetVacunasByTipos(token, pacient.tipo, idPacient.idPacient)).data;
        setMisVacunas(vacunas);

        const { calendario } = await (await GetCalendarVacunas(token, idPacient.idPacient)).data;
        setCalendario(calendario);

        const { user } = await (await GetUserByPacient(token, idPacient.idPacient)).data;
        setUser(user);

        const { HistoriVacunas } = await (await GetVacunasHistory(token, idPacient.idPacient)).data;
        setHistoryVacunas(HistoriVacunas);

        fetchSeguimiento();

        setLoading(false);
      };

      idPacient.idPacient && fetchPacient();

      if (ActualizarCalendario) {
        setActualizarCalendario(false);
      }
    } catch (error) {
      console.log(error.message);
      setLoading(false);
    }
  }, [idPacient, ActualizarCalendario]);

  useEffect(() => {
    if (ActualizarSeguimiento) {
      fetchSeguimiento();
      setActualizarSeguimiento(false);
      setLoading(false);
    }
  }, [ActualizarSeguimiento]);

  const fetchSeguimiento = async () => {
    setLoading(true);
    const { MisSeguimientos } = await (await getSeguimiento(token, idPacient.idPacient)).data;
    setSeguimiento(MisSeguimientos);
  };

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
        <Toolbar tipo={Pacient && Pacient.tipo} idPacient={idPacient.idPacient} setActualizarCalendario={setActualizarCalendario} setActualizarSeguimiento={setActualizarSeguimiento} />
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
                    events={MyCalendario}
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
                  <TableMisVacunas vacunas={MisVacuas} setActualizarCalendario={setActualizarCalendario} />
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

              <Accordion expanded={expanded === 'panel4'} onChange={handleChange('panel4')}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="panel1bh-content"
                  id="panel1bh-header"
                >
                  <Typography className={classes.heading}>
                    Historial clinico
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <HistorialClinico token={token} Pacient={Pacient} User={User} classes={classes} HistoryVacunas={HistoryVacunas} Seguimiento={Seguimiento} setActualizarSeguimiento={setActualizarSeguimiento} />
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
