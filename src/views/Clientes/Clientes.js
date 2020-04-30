import React, { useState } from 'react';
import { makeStyles } from '@material-ui/styles';

import { ClientesToolbar, ClientesTable } from './components';
import mockData from './data';

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3)
  },
  content: {
    marginTop: theme.spacing(2)
  }
}));

const ClientesList = () => {
  const classes = useStyles();

  const [clientes] = useState(mockData);

  return (
    <div className={classes.root}>
      <ClientesToolbar />
      <div className={classes.content}>
        <ClientesTable clientes={clientes} />
      </div>
    </div>
  );
};

export default ClientesList;
