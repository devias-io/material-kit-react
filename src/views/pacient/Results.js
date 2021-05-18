/* eslint-disable no-alert */
/* eslint-disable no-unused-expressions */
/* eslint-disable react/prop-types */
import React, { useEffect, useState, useContext } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import moment from 'moment';
import PerfectScrollbar from 'react-perfect-scrollbar';
import {
  Avatar,
  Box,
  Card,
  Table,
  Popover,
  Button,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  makeStyles
} from '@material-ui/core';
import { Link } from 'react-router-dom';
import getInitials from 'src/utils/getInitials';
import { useSelector } from 'react-redux';
import AlertDialog from '../../components/dialogo';
import { RemovePacient } from '../../api/pacient';
import { TokenContext } from '../../lib/context/contextToken';
import ModalElement from '../../components/Modal';
import CambiarDueno from './cambio-dueno';

const useStyles = makeStyles((theme) => ({
  root: {},
  avatar: {
    marginRight: theme.spacing(2)
  },
  popover: {
    pointerEvents: 'none',
  },
  paper: {
    padding: theme.spacing(1),
  },
}));

const Results = ({
  className, pacient, setActualizarPacient, searchPacient, ...rest
}) => {
  const { token } = useContext(TokenContext);
  const classes = useStyles();
  const { me } = useSelector((state) => state.Sesion);
  const [dialogo, setDialogo] = useState(false);
  const [modal, setModal] = useState(false);
  const [IsDelete, setIsDelete] = useState(false);
  const [Loading, setLoading] = useState(false);
  const [IdPacient, setIdPacient] = useState('');

  const [anchorEl, setAnchorEl] = React.useState(null);

  const handlePopoverOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  useEffect(() => {
    const DeletePacient = async () => {
      setLoading(true);

      try {
        await RemovePacient(token, IdPacient);
        setActualizarPacient(true);
        setLoading(false);
      } catch (error) {
        console.log(error.message);
        setLoading(false);
      }
    };

    !dialogo && setIdPacient('');

    IsDelete && IdPacient && DeletePacient();
  }, [IsDelete, IdPacient, modal]);

  return (
    <>
      <Card
        className={clsx(classes.root, className)}
        {...rest}
      >
        <PerfectScrollbar>
          <Box minWidth={1050}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    Name
                  </TableCell>
                  <TableCell>
                    Email Dueño
                  </TableCell>
                  <TableCell>
                    Altura
                  </TableCell>
                  <TableCell>
                    Peso
                  </TableCell>
                  <TableCell>
                    Animal
                  </TableCell>
                  <TableCell>
                    Raza
                  </TableCell>
                  <TableCell>
                    Sexo
                  </TableCell>
                  <TableCell>
                    Registrado el
                  </TableCell>
                  <TableCell>
                    Nacio el
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pacient.filter((item) => {
                  return item.nombre?.toLowerCase().includes(searchPacient.toLowerCase())
                  || item.emailPerson.toLowerCase().includes(searchPacient.toLowerCase())
                  || item.sexo.toLowerCase().includes(searchPacient.toLowerCase())
                  || item.raza.toLowerCase().includes(searchPacient.toLowerCase())
                  || item.tipo.toLowerCase().includes(searchPacient.toLowerCase());
                }).map((paciente) => (
                  <TableRow
                    hover
                    key={paciente.idUser}
                  >
                    <TableCell>
                      <Box
                        alignItems="center"
                        display="flex"
                      >
                        <Avatar
                          className={classes.avatar}
                          src={paciente.avatar}
                        >
                          {getInitials(paciente.nombre || '')}
                        </Avatar>
                        <Typography
                          color="textPrimary"
                          variant="body1"
                        >
                          {paciente.nombre || 'Sin Nombre'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <span
                        style={{ cursor: 'pointer' }}
                        aria-owns={open ? 'mouse-over-popover' : undefined}
                        aria-haspopup="true"
                        onMouseEnter={handlePopoverOpen}
                        onMouseLeave={handlePopoverClose}
                        onClick={() => {
                          if (me.isAdmin) {
                            setModal(true);
                            setIdPacient(paciente.idPacient);
                          } else {
                            alert('Solo adminiistradores pueden cambiar de dueño');
                          }
                        }}
                      >
                        {paciente.emailPerson || 'Sin Dueño'}
                      </span>
                      <Popover
                        id="mouse-over-popover"
                        className={classes.popover}
                        classes={{
                          paper: classes.paper,
                        }}
                        open={open}
                        anchorEl={anchorEl}
                        anchorOrigin={{
                          vertical: 'bottom',
                          horizontal: 'left',
                        }}
                        transformOrigin={{
                          vertical: 'top',
                          horizontal: 'left',
                        }}
                        onClose={handlePopoverClose}
                        disableRestoreFocus
                      >
                        <Typography>Cambiar de dueño.</Typography>
                      </Popover>
                    </TableCell>
                    <TableCell>
                      {paciente.altura}
                      {' '}
                      CM
                    </TableCell>
                    <TableCell>
                      {paciente.peso}
                      {' '}
                      KL
                    </TableCell>
                    <TableCell>
                      {paciente.tipo}
                    </TableCell>
                    <TableCell>
                      {paciente.raza}
                    </TableCell>
                    <TableCell>
                      {paciente.sexo}
                    </TableCell>
                    <TableCell>
                      {moment(paciente.created_at).format('LLL')}
                    </TableCell>
                    <TableCell>
                      {moment(paciente.nacimiento).format('LL')}
                    </TableCell>
                    <TableCell>
                      <Link to={`/app/pacient/${paciente.idPacient}`}>
                        <Button
                          size="small"
                          variant="contained"
                        >
                          Detalles
                        </Button>
                      </Link>
                      &nbsp; &nbsp;
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => {
                          setDialogo(true);
                          setIdPacient(paciente.idPacient);
                        }}
                      >
                        {Loading ? 'Cargando...' : 'ELiminar'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </PerfectScrollbar>
      </Card>

      <AlertDialog visible={dialogo} setVisible={setDialogo} setIsDelete={setIsDelete}>
        <p>¿Estás seguro que quieres eliminar este registro?, una vez hecho será irrecuperable.</p>
      </AlertDialog>

      <ModalElement visible={modal} setVisible={setModal}>
        <CambiarDueno IdPacient={IdPacient} setActualizarPacient={setActualizarPacient} />
      </ModalElement>
    </>
  );
};

Results.propTypes = {
  className: PropTypes.string,
  customers: PropTypes.array.isRequired
};

export default Results;
