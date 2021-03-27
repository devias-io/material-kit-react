/* eslint-disable react/no-unescaped-entities */
/* eslint-disable max-len */
/* eslint-disable react/button-has-type */
/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import moment from 'moment';
import {
  Grid, Avatar, List, ListItem, Chip
} from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import { calculaEdad } from '../../../helpers/Fechas';
import getInitials from '../../../utils/getInitials';
import ListSeguimiento from './list-seguimiento';
import ListSeguimientoMucosas from './List-Seguimiento-Mucosas';
import AlertDialog from '../../../components/dialogo';
import { deleteSeguimiento } from '../../../api/seguimiento';

const HistorialClinico = ({
  token, Pacient, User, classes, HistoryVacunas, Seguimiento, setActualizarSeguimiento
}) => {
  const styles = {
    head: {
      padding: 10, backgroundColor: '#cdcdcd', fontWeight: 'bold'
    }
  };

  const [dialogo, setDialogo] = useState(false);
  const [isDelete, setIsDelete] = useState(false);
  const [idSeguimiento, setIdSeguimiento] = useState('');

  useEffect(() => {
    try {
      const fetchDeleteSeguimiento = async () => {
        await deleteSeguimiento(token, idSeguimiento);
        setActualizarSeguimiento(true);
        setIdSeguimiento('');
        setIsDelete(false);
      };

      if (idSeguimiento && !isDelete) {
        setDialogo(true);
      }

      if (isDelete && idSeguimiento) {
        fetchDeleteSeguimiento();
      }
    } catch (error) {
      console.log(error.message);
    }
  }, [isDelete, idSeguimiento]);

  const [Alimentacion, setAlimentacion] = useState([]);
  const [Reproduccion, setReproducion] = useState([]);
  const [Habitat, setHabitat] = useState([]);
  const [Cirugias, setCirugias] = useState([]);
  const [Alergias, setAlergias] = useState([]);
  const [Enfermedades, setEnfermedades] = useState([]);
  const [Antecedentes, setAntecedentes] = useState([]);
  const [Actitud, setActitud] = useState([]);
  const [Corporal, setCorporal] = useState([]);
  const [Hidratacion, setHidratacion] = useState([]);
  /* Mucosas */
  const [SistemaNervioso, setSistemaNervioso] = useState([]);
  const [Nodulos, setNodulos] = useState([]);
  const [Conjuntival, setConjuntival] = useState([]);
  const [Oral, setOral] = useState([]);
  const [Oido, setOido] = useState([]);
  const [Piel, setPiel] = useState([]);
  const [Locomocion, setLocomocion] = useState([]);
  const [Cardiovascular, setCardiovascular] = useState([]);
  const [Respiratorio, setRespiratorio] = useState([]);
  const [Desparatisacion, setDesparatisacion] = useState([]);
  const [Digestivo, setDigestivo] = useState([]);

  useEffect(() => {
    const filterAlimentacion = Seguimiento.filter((item) => item.category === 'Alimentacion');
    setAlimentacion(filterAlimentacion);

    const filterReproduccion = Seguimiento.filter((item) => item.category === 'Reproduccion');
    setReproducion(filterReproduccion);

    const filterHabitat = Seguimiento.filter((item) => item.category === 'Habitat');
    setHabitat(filterHabitat);

    const filterCirugia = Seguimiento.filter((item) => item.category === 'Cirugias');
    setCirugias(filterCirugia);

    const filterAlergias = Seguimiento.filter((item) => item.category === 'Alergias');
    setAlergias(filterAlergias);

    const filterEnfermedades = Seguimiento.filter((item) => item.category === 'Enfermedades');
    setEnfermedades(filterEnfermedades);

    const filterAntecedentes = Seguimiento.filter((item) => item.category === 'Antecedentes');
    setAntecedentes(filterAntecedentes);

    const filterActitud = Seguimiento.filter((item) => item.category === 'Actitud');
    setActitud(filterActitud);

    const filterCorporal = Seguimiento.filter((item) => item.category === 'Corporal');
    setCorporal(filterCorporal);

    const filterHidratacion = Seguimiento.filter((item) => item.category === 'Hidratacion');
    setHidratacion(filterHidratacion);

    const filterDesparasitacion = Seguimiento.filter((item) => item.category === 'Desparasitacion');
    setDesparatisacion(filterDesparasitacion);

    /* Mucosas */

    const filterNervioso = Seguimiento.filter((item) => item.category === 'Muscosas - Sistema nervioso');
    setSistemaNervioso(filterNervioso);

    const filterNodulos = Seguimiento.filter((item) => item.category === 'Muscosas - Nodulos Linfaticos');
    setNodulos(filterNodulos);

    const filterConjuntival = Seguimiento.filter((item) => item.category === 'Muscosas - Conjuntival');
    setConjuntival(filterConjuntival);

    const filterOral = Seguimiento.filter((item) => item.category === 'Muscosas - Oral');
    setOral(filterOral);

    const filterOido = Seguimiento.filter((item) => item.category === 'Muscosas - Oido');
    setOido(filterOido);

    const filterPiel = Seguimiento.filter((item) => item.category === 'Muscosas - Oido');
    setPiel(filterPiel);

    const filterLocomocion = Seguimiento.filter((item) => item.category === 'Muscosas - Locomocion');
    setLocomocion(filterLocomocion);

    const filterCardiovascular = Seguimiento.filter((item) => item.category === 'Muscosas - A.Cardiovascular');
    setCardiovascular(filterCardiovascular);

    const filterRespiratorio = Seguimiento.filter((item) => item.category === 'Muscosas - A.Respiratorio');
    setRespiratorio(filterRespiratorio);

    const filterDigestivo = Seguimiento.filter((item) => item.category === 'Muscosas - A.Digestivo');
    setDigestivo(filterDigestivo);
  }, [Seguimiento]);

  return (
    <>
      <Grid container spacing={1} direction="row">
        {/* <Grid item xs={12}>
          <Button variant="contained" color="primary">Obtener historial clinico</Button>
        </Grid> */}
        <Grid item xs={12} style={styles.head}>
          Reseña del paciente
        </Grid>
        <Grid item md={4}>
          <span>
            <strong>Nombre:</strong>
            {' '}
            {Pacient.nombre}
          </span>
        </Grid>
        <Grid item md={4}>
          <strong>
            Tipo:
          </strong>
          {' '}
          <span>{Pacient.tipo}</span>
        </Grid>
        <Grid item md={4}>
          <strong>
            Raza:
          </strong>
          {' '}
          <span>{Pacient.raza}</span>
        </Grid>

        <Grid item md={4}>
          <strong>
            Sexo:
          </strong>
          {' '}
          <span>{Pacient.sexo}</span>
        </Grid>
        <Grid item md={4}>
          <strong>
            Nacimiento:
          </strong>
          {' '}
          <span>{moment(Pacient.nacimiento).format('LL')}</span>
        </Grid>
        <Grid item md={4}>
          <strong>
            Edad:
          </strong>
          {' '}
          <span>{calculaEdad(moment(), Pacient.nacimiento)}</span>
        </Grid>

        <br />
        <br />
        <br />

        <Grid item xs={12} style={styles.head}>
          Datos del propietario
        </Grid>
        <Grid item md={4}>
          <strong>Nombre:</strong>
          {' '}
          <span>{User.userName}</span>
        </Grid>
        <Grid item md={4}>
          <strong>Correo:</strong>
          {' '}
          <span>{User.email}</span>
        </Grid>
        <Grid item md={4}>
          <strong>Telefono:</strong>
          {' '}
          <span>{User.Phone || 'Ninguno'}</span>
        </Grid>

        <Grid item md={4}>
          <strong>Cedula:</strong>
          {' '}
          <span>{User.cedula || 'Ninguno'}</span>
        </Grid>
        <Grid item md={4}>
          <strong>Foto:</strong>
          {' '}
          <Avatar
            className={classes.avatar}
            src={User.avatar}
          >
            {getInitials(User.userName)}
          </Avatar>
        </Grid>
        <Grid item md={4}>
          <strong>Registrado:</strong>
          {' '}
          <span>{moment(User.created_at).format('LL')}</span>
        </Grid>

        <br />
        <br />
        <br />

        <Grid item xs={12} style={styles.head}>
          Historial del paciente
        </Grid>

        <Grid item md={6}>
          <strong>Foto</strong>
          <br />
          <Avatar
            className={classes.avatar}
            src={Pacient.avatar}
          >
            {getInitials(Pacient.nombre)}
          </Avatar>
        </Grid>
        <Grid item md={4}>
          <strong>Vacunas:</strong>
          <br />
          <List component="nav" aria-label="secondary mailbox folders">
            {HistoryVacunas.length === 0 && <Alert severity="info">No tiene vacunas registradas</Alert>}
            {HistoryVacunas.map((history) => (
              <ListItem button>
                <Chip label={history.nombres} />
                {' '}
                -
                <Chip label={history.name} color="primary" />
                {' '}
                -
                <Chip label={moment(history.created_at).format('LL')} color="secondary" />
              </ListItem>
            ))}
          </List>
        </Grid>

        <Grid item md={6}>
          <strong>Ultimas desparasitacion:</strong>
          <br />
          <ListSeguimiento data={Desparatisacion} category="desparasitacion" setIdSeguimiento={setIdSeguimiento} />
        </Grid>

        <Grid item md={6}>
          <strong>Alimentacion:</strong>
          <br />
          <ListSeguimiento data={Alimentacion} category="Alimentacion" setIdSeguimiento={setIdSeguimiento} />
        </Grid>

        <Grid item md={6}>
          <strong>Estado Reproductivo:</strong>
          <br />
          <ListSeguimiento data={Reproduccion} category="Reproduccion" setIdSeguimiento={setIdSeguimiento} />
        </Grid>
        <Grid item md={6}>
          <strong>Habitat:</strong>
          <br />
          <ListSeguimiento data={Habitat} category="Habitat" setIdSeguimiento={setIdSeguimiento} />
        </Grid>

        <Grid item md={6}>
          <strong>Cirugias:</strong>
          <br />
          <ListSeguimiento data={Cirugias} category="Cirugia" setIdSeguimiento={setIdSeguimiento} />
        </Grid>
        <Grid item md={6}>
          <strong>Alergias:</strong>
          <br />
          <ListSeguimiento data={Alergias} category="Alergias" setIdSeguimiento={setIdSeguimiento} />
        </Grid>

        <Grid item md={6}>
          <strong>Enfermedades:</strong>
          <br />
          <ListSeguimiento data={Enfermedades} category="Enfermedad" setIdSeguimiento={setIdSeguimiento} />
        </Grid>
        <Grid item md={6}>
          <strong>Antecedentes familiares:</strong>
          <br />
          <ListSeguimiento data={Antecedentes} category="Antecedentes" setIdSeguimiento={setIdSeguimiento} />
        </Grid>

        <br />
        <br />
        <br />

        <Grid item xs={12} style={styles.head}>
          Examen Clinico
        </Grid>

        <Grid item md={6}>
          <strong>Actitud:</strong>
          <br />
          <ListSeguimiento data={Actitud} category="Actitud" setIdSeguimiento={setIdSeguimiento} />
        </Grid>

        <Grid item md={6}>
          <strong>Condicion Corporal:</strong>
          <br />
          <ListSeguimiento data={Corporal} category="Condicion corporal" setIdSeguimiento={setIdSeguimiento} />
        </Grid>

        <Grid item md={6}>
          <strong>Estado de hidratacion:</strong>
          <br />
          <ListSeguimiento data={Hidratacion} category="Hidratacion" setIdSeguimiento={setIdSeguimiento} />
        </Grid>

        <br />
        <br />
        <br />

        <Grid item md={12} style={styles.head}>
          Mucosas:
        </Grid>

        <Grid item md={12}>
          <strong>Conjuntival:</strong>
          <br />
          <ListSeguimientoMucosas data={Conjuntival} category="Conjuntival" setIdSeguimiento={setIdSeguimiento} />
        </Grid>

        <Grid item md={12}>
          <strong>Oral:</strong>
          <br />
          <ListSeguimientoMucosas data={Oral} category="Oral" setIdSeguimiento={setIdSeguimiento} />
        </Grid>

        <Grid item md={12}>
          <strong>Oido:</strong>
          <br />
          <ListSeguimientoMucosas data={Oido} category="Oido" setIdSeguimiento={setIdSeguimiento} />
        </Grid>

        <Grid item md={12}>
          <strong>Nodulos Linfaticos:</strong>
          <br />
          <ListSeguimientoMucosas data={Nodulos} category="Nodulos Linfaticos" setIdSeguimiento={setIdSeguimiento} />
        </Grid>

        <Grid item md={12}>
          <strong>Piel y Anexos:</strong>
          <br />
          <ListSeguimientoMucosas data={Piel} category="Piel y Anexos" setIdSeguimiento={setIdSeguimiento} />
        </Grid>

        <Grid item md={12}>
          <strong>Locomocion:</strong>
          <br />
          <ListSeguimientoMucosas data={Locomocion} category="Locomocion" setIdSeguimiento={setIdSeguimiento} />
        </Grid>

        <Grid item md={12}>
          <strong>Sistema nervioso:</strong>
          <br />
          <ListSeguimientoMucosas data={SistemaNervioso} category="Sistema nervioso" setIdSeguimiento={setIdSeguimiento} />
        </Grid>

        <Grid item md={12}>
          <strong>A.Cardiovascular:</strong>
          <br />
          <ListSeguimientoMucosas data={Cardiovascular} category="A.Cardiovascular" setIdSeguimiento={setIdSeguimiento} />
        </Grid>

        <Grid item md={12}>
          <strong>A.Respiratorio:</strong>
          <br />
          <ListSeguimientoMucosas data={Respiratorio} category="A.Respiratorio" setIdSeguimiento={setIdSeguimiento} />
        </Grid>

        <Grid item md={12}>
          <strong>A.Digestivo:</strong>
          <br />
          <ListSeguimientoMucosas data={Digestivo} category="A.Digestivo" setIdSeguimiento={setIdSeguimiento} />
        </Grid>

      </Grid>

      <AlertDialog visible={dialogo} setVisible={setDialogo} setIsDelete={setIsDelete}>
        <p>¿Estás seguro que quieres eliminar este registro?, una vez hecho será irrecuperable.</p>
      </AlertDialog>
    </>
  );
};

export default HistorialClinico;
