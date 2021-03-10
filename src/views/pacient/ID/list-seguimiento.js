/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import {
  List, ListItem, Chip, Button
} from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import moment from 'moment';

const ListSeguimiento = ({ data, category, setIdSeguimiento }) => {
  const [loading, setLoading] = useState(false);

  return (
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
        <ListItem button>
          <Chip label={item.title} color="secondary" />
          {' '}
          -
          <Chip label={moment(item.created_at).format('LL')} />
          <Button
            style={{ color: 'red' }}
            onClick={() => {
              setIdSeguimiento(item.id_seguimiento);
              setLoading(true);
              setTimeout(() => setLoading(false), 2000);
            }}
          >
            {loading ? 'Cargando...' : 'Eliminar'}
          </Button>
        </ListItem>
      ))}
    </List>
  );
};

export default ListSeguimiento;
