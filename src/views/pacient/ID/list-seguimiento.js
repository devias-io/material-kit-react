/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import {
  List, ListItem, Chip, Button
} from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import moment from 'moment';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import ModalElement from '../../../components/Modal';
import UpdateHistory from '../../../components/updateHistorial';

const ListSeguimiento = ({ data, category, setIdSeguimiento }) => {
  const [loading, setLoading] = useState(false);
  const [Modal, setModal] = useState(false);

  return (
    <>
      <List component="nav" aria-label="secondary mailbox folders">
        {data.length === 0 && (
          <Alert severity="info">
            No tiene seguimiento de
            {' '}
            <strong>{category}</strong>
            {' '}
            registrados
          </Alert>
        )}
        {data.map((item) => (
          <>
            <ListItem button>
              <Chip label={item.title} color="secondary" />
              {' '}
              -
              <Chip label={moment(item.created_at).format('LL')} />
              <Button
                style={{ color: 'orange' }}
                disabled={loading}
                onClick={() => {
                  // setIdSeguimiento(item.id_seguimiento);
                  setModal(true);
                }}
              >
                {loading ? '....' : <EditIcon />}
              </Button>
              <Button
                disabled={loading}
                style={{ color: 'red' }}
                onClick={() => {
                  setIdSeguimiento(item.id_seguimiento);
                  setLoading(true);
                  setTimeout(() => setLoading(false), 2000);
                }}
              >
                {loading ? '....' : <DeleteIcon />}
              </Button>
            </ListItem>

            <ModalElement visible={Modal} setVisible={setModal}>
              <UpdateHistory title={item.title} idSeguimiento={item.id_seguimiento} />
            </ModalElement>
          </>
        ))}
      </List>
    </>
  );
};

export default ListSeguimiento;
