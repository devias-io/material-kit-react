import React, { useState } from 'react';
import { makeStyles } from '@material-ui/styles';
import { IconButton, Grid, Typography } from '@material-ui/core';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';

import { ProdutosToolbar, ProdutoCard } from './components';
import mockData from './data';

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3)
  },
  content: {
    marginTop: theme.spacing(2)
  },
  pagination: {
    marginTop: theme.spacing(3),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end'
  }
}));

const ProdutoList = () => {
  const classes = useStyles();

  const [produtos] = useState(mockData);

  return (
    <div className={classes.root}>
      <ProdutosToolbar />
      <div className={classes.content}>
        <Grid
          container
          spacing={3}
        >
          {produtos.map(produto => (
            <Grid
              item
              key={produto.id}
              lg={4}
              md={6}
              xs={12}
            >
              <ProdutoCard produto={produto} />
            </Grid>
          ))}
        </Grid>
      </div>
      <div className={classes.pagination}>
        <Typography variant="caption">1-6 de 20</Typography>
        <IconButton>
          <ChevronLeftIcon />
        </IconButton>
        <IconButton>
          <ChevronRightIcon />
        </IconButton>
      </div>
    </div>
  );
};

export default ProdutoList;
