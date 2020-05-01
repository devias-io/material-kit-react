import React, { useState } from 'react';
import { makeStyles } from '@material-ui/styles';

import { FornecedoresToolbar, FornecedoresTable } from './components';
import mockData from './data';

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3)
  },
  content: {
    marginTop: theme.spacing(2)
  }
}));

const FornecedorList = () => {
  const classes = useStyles();

  const [fornecedores] = useState(mockData);

  return (
    <div className={classes.root}>
      <FornecedoresToolbar />
      <div className={classes.content}>
        <FornecedoresTable fornecedores={fornecedores} />
      </div>
    </div>
  );
};

export default FornecedorList;
