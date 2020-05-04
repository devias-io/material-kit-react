import React, { useState } from 'react';
import { makeStyles } from '@material-ui/styles';
// import { Grid } from '@material-ui/core';

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

        {/* <div className={classes.content}>
          <AddFornecedores />
        </div> */}


       
      </div>
    </div>
  );
};

export default FornecedorList;
