/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {
  Box,
  Button,
  makeStyles
} from '@material-ui/core';
import ModalElement from '../../components/Modal';
import NewCitas from '../../components/newCita';

const useStyles = makeStyles((theme) => ({
  root: {},
  importButton: {
    marginRight: theme.spacing(1)
  },
  exportButton: {
    marginRight: theme.spacing(1)
  }
}));

const Toolbar = ({
  className, setActualizarCitas, ...rest
}) => {
  const [modal, setModal] = useState(false);
  const classes = useStyles();

  return (
    <div
      className={clsx(classes.root, className)}
      {...rest}
    >
      <Box
        display="flex"
        justifyContent="flex-end"
      >
        <Button
          color="primary"
          variant="contained"
          onClick={() => setModal(true)}
        >
          Nueva cita
        </Button>
      </Box>

      <ModalElement visible={modal} setVisible={setModal}>
        <NewCitas setActualizarCitas={setActualizarCitas} />
      </ModalElement>
    </div>
  );
};

Toolbar.propTypes = {
  className: PropTypes.string
};

export default Toolbar;
