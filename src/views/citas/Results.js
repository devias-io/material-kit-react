/* eslint-disable max-len */
/* eslint-disable no-unused-expressions */
/* eslint-disable react/prop-types */
import React, { useState, useContext } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import Alert from '@material-ui/lab/Alert';
import PerfectScrollbar from 'react-perfect-scrollbar';
import {
  Box,
  Card,
  makeStyles,
  Avatar,
  CardContent,
  Divider,
  Typography,
  Chip,
  CardHeader,
  Button,
} from '@material-ui/core';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { useSelector } from 'react-redux';
import { UpdateAsistirCita, DeleteCita } from '../../api/citas';
import AlertDialog from '../../components/dialogo';
import { TokenContext } from '../../lib/context/contextToken';
import getInitials from '../../utils/getInitials';

const useStyles = makeStyles((theme) => ({
  Card: {
    maxWidth: 345,
    padding: 10,
  },
  avatar: {
    marginRight: theme.spacing(2)
  }
}));

const Results = ({
  className, Citas, setActualizarCitas, ...rest
}) => {
  const classes = useStyles();
  const { token } = useContext(TokenContext);
  const [dialogo, setDialogo] = useState(false);
  const { me } = useSelector((state) => state.Sesion);

  const renderStatus = (status) => {
    switch (status) {
      case 'Pendiente':
        return 'Asistir';
      case 'Cancelado':
        return 'Asistir';
      case 'Asistir':
        return 'Cancelado';
      default:
        return '';
    }
  };

  const changeAsistir = async (idSolicitud, status) => {
    try {
      await UpdateAsistirCita(token, renderStatus(status), idSolicitud);
      setActualizarCitas(true);
    } catch (error) {
      console.log(error.message);
    }
  };

  const deleteCita = async (idSolicitud) => {
    console.log(idSolicitud);
    try {
      await DeleteCita(token, idSolicitud);
      setActualizarCitas(true);
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <Card
      className={clsx(classes.root, className)}
      {...rest}
    >
      <PerfectScrollbar>
        <Box minWidth={100}>
          {Citas.map((item) => (
            <Card className={classes.Card} key={item.idSolicitud}>
              <CardHeader
                avatar={(
                  <Avatar aria-label="recipe" className={classes.avatar} src={item.cliente_avatar}>
                    {getInitials(item.cliente_usermane)}
                  </Avatar>
                )}
                title={item.cliente_usermane}
                subheader={moment(item.create_at).format('LL')}
              />
              <CardContent>
                <strong>Animal</strong>
                <Box
                  alignItems="center"
                  display="flex"
                >
                  <Avatar
                    className={classes.avatar}
                    src={item.avatar_pacient}
                  >
                    {getInitials(item.nombre)}
                  </Avatar>
                  <Typography
                    color="textPrimary"
                    variant="body1"
                  >
                    <Link to={`/app/pacient/${item.idPacient}`}>
                      {item.nombre}
                    </Link>
                  </Typography>
                </Box>
                <br />
                <strong>Oberservaciones</strong>
                <Typography variant="body2" color="textSecondary" component="p">
                  {item.observaciones}
                </Typography>
                <br />
                <strong>Direccion</strong>
                <Typography variant="body2" color="textSecondary" component="p">
                  {item.direccion}
                </Typography>
                <br />
                <strong>Solicitado para el: </strong>
                {' '}
                <span>{moment(item.solicitado).format('LL')}</span>
                <br />
                <strong>A las: </strong>
                {' '}
                <span>{item.time}</span>
                <br />
                Estado:
                {' '}
                <Chip label={item.status} color="primary" />
                <br />
                <Divider />
                {item.idUser ? (
                  <>
                    <br />
                    <strong>Veterinario</strong>
                    <Box
                      alignItems="center"
                      display="flex"
                    >
                      <Avatar
                        className={classes.avatar}
                        src={item.user_avatar}
                      >
                        {getInitials(item.user_username)}
                      </Avatar>
                      <Typography
                        color="textPrimary"
                        variant="body1"
                      >
                        {item.user_username}
                      </Typography>
                    </Box>
                    <br />
                  </>
                ) : ''}
                <Divider />
                <br />
                {me.isAdmin ? (
                  <>
                    {renderStatus(item.status) !== 'Asistir' && (
                      <Button onClick={() => changeAsistir(item.idSolicitud, item.status)} color="secondary">{renderStatus(item.status) === 'Cancelado' ? 'Cancelar' : renderStatus(item.status)}</Button>
                    )}
                  </>
                ) : <Button style={{ color: 'red' }} onClick={() => deleteCita(item.idSolicitud)}>Eliminar</Button>}
              </CardContent>
            </Card>
          ))}

          {Citas.length === 0 && (
            <Alert severity="info">No hay citas</Alert>
          )}
        </Box>
      </PerfectScrollbar>
      <AlertDialog visible={dialogo} setVisible={setDialogo} setIsDelete={0}>
        <p>¿Estás seguro que quieres eliminar este registro?, una vez hecho será irrecuperable.</p>
      </AlertDialog>
    </Card>
  );
};

Results.propTypes = {
  className: PropTypes.string,
  Citas: PropTypes.array.isRequired
};

export default Results;
