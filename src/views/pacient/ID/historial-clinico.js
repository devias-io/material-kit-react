/* eslint-disable react/no-unescaped-entities */
/* eslint-disable max-len */
/* eslint-disable react/button-has-type */
/* eslint-disable react/prop-types */
import React from 'react';
import moment from 'moment';
import {
  Grid, Avatar, List, ListItem, ListItemText, Chip
} from '@material-ui/core';
import { calculaEdad } from '../../../helpers/Fechas';
import getInitials from '../../../utils/getInitials';

const HistorialClinico = ({
  Pacient, User, classes, HistoryVacunas
}) => {
  const styles = {
    head: {
      padding: 10, backgroundColor: '#cdcdcd', fontWeight: 'bold'
    }
  };

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

        <Grid item md={2}>
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

        <Grid item md={4}>
          <strong>Ultima desparasitacion:</strong>
          <br />
          <List component="nav" aria-label="secondary mailbox folders">
            <ListItem button>
              <ListItemText primary="Trash" />
            </ListItem>
            <ListItem button>
              <ListItemText primary="Spam" />
            </ListItem>
          </List>
        </Grid>

        <Grid item md={4}>
          <strong>Alimentacion:</strong>
          <br />
          <List component="nav" aria-label="secondary mailbox folders">
            <ListItem button>
              <ListItemText primary="Trash" />
            </ListItem>
            <ListItem button>
              <ListItemText primary="Spam" />
            </ListItem>
          </List>
        </Grid>

        <Grid item md={4}>
          <strong>Estado Reproductivo:</strong>
          <br />
          <List component="nav" aria-label="secondary mailbox folders">
            <ListItem button>
              <ListItemText primary="Trash" />
            </ListItem>
            <ListItem button>
              <ListItemText primary="Spam" />
            </ListItem>
          </List>
        </Grid>
        <Grid item md={4}>
          <strong>Habitat:</strong>
          <br />
          <List component="nav" aria-label="secondary mailbox folders">
            <ListItem button>
              <ListItemText primary="Trash" />
            </ListItem>
            <ListItem button>
              <ListItemText primary="Spam" />
            </ListItem>
          </List>
        </Grid>

        <Grid item md={4}>
          <strong>Cirugias:</strong>
          <br />
          <List component="nav" aria-label="secondary mailbox folders">
            <ListItem button>
              <ListItemText primary="Trash" />
            </ListItem>
            <ListItem button>
              <ListItemText primary="Spam" />
            </ListItem>
          </List>
        </Grid>
        <Grid item md={4}>
          <strong>Alergias:</strong>
          <br />
          <List component="nav" aria-label="secondary mailbox folders">
            <ListItem button>
              <ListItemText primary="Trash" />
            </ListItem>
            <ListItem button>
              <ListItemText primary="Spam" />
            </ListItem>
          </List>
        </Grid>

        <Grid item md={4}>
          <strong>Enfermedades:</strong>
          <br />
          <List component="nav" aria-label="secondary mailbox folders">
            <ListItem button>
              <ListItemText primary="Trash" />
            </ListItem>
            <ListItem button>
              <ListItemText primary="Spam" />
            </ListItem>
          </List>
        </Grid>
        <Grid item md={4}>
          <strong>Antecedentes familiares:</strong>
          <br />
          <List component="nav" aria-label="secondary mailbox folders">
            <ListItem button>
              <ListItemText primary="Trash" />
            </ListItem>
            <ListItem button>
              <ListItemText primary="Spam" />
            </ListItem>
          </List>
        </Grid>

        <br />
        <br />
        <br />

        <Grid item xs={12} style={styles.head}>
          Examen Clinico
        </Grid>

        <Grid item md={4}>
          <strong>Actitud:</strong>
          <br />
          <List component="nav" aria-label="secondary mailbox folders">
            <ListItem button>
              <ListItemText primary="Trash" />
            </ListItem>
            <ListItem button>
              <ListItemText primary="Spam" />
            </ListItem>
          </List>
        </Grid>

        <Grid item md={4}>
          <strong>Condicion Corporal:</strong>
          <br />
          <List component="nav" aria-label="secondary mailbox folders">
            <ListItem button>
              <ListItemText primary="Trash" />
            </ListItem>
            <ListItem button>
              <ListItemText primary="Spam" />
            </ListItem>
          </List>
        </Grid>

        <Grid item md={4}>
          <strong>Estado de hidratacion:</strong>
          <br />
          <List component="nav" aria-label="secondary mailbox folders">
            <ListItem button>
              <ListItemText primary="Trash" />
            </ListItem>
            <ListItem button>
              <ListItemText primary="Spam" />
            </ListItem>
          </List>
        </Grid>

        <br />
        <br />
        <br />

        <Grid item md={12} style={styles.head}>
          Mucosas:
        </Grid>

        <Grid item md={2}>
          <strong>Conjuntival:</strong>
          <br />
          <span>No</span>
        </Grid>

        <Grid item md={7}>
          <strong>Oral:</strong>
          <br />
          <span>Si</span>
          <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</p>
        </Grid>

        <Grid item md={2}>
          <strong>Oido:</strong>
          <br />
          <span>No</span>
        </Grid>

        <Grid item md={2}>
          <strong>Nodulos Linfaticos:</strong>
          <br />
          <span>No</span>
        </Grid>

        <Grid item md={2}>
          <strong>Piel y Anexos:</strong>
          <br />
          <span>No</span>
        </Grid>

        <Grid item md={2}>
          <strong>Locomocion:</strong>
          <br />
          <span>No</span>
        </Grid>

        <Grid item md={2}>
          <strong>Sistema nervioso:</strong>
          <br />
          <span>No</span>
        </Grid>

        <Grid item md={2}>
          <strong>A.Cardiovascular:</strong>
          <br />
          <span>No</span>
        </Grid>

        <Grid item md={2}>
          <strong>A.Respiratorio:</strong>
          <br />
          <span>No</span>
        </Grid>

        <Grid item md={2}>
          <strong>A.Digestivo:</strong>
          <br />
          <span>No</span>
        </Grid>

      </Grid>
    </>
  );
};

export default HistorialClinico;
