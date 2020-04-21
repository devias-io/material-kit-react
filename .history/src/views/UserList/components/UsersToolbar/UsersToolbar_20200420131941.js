import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/styles';
import {
  Button,
  TextField,
  Grid
} from '@material-ui/core';

const useStyles = makeStyles(theme => ({
  root: {},
  row: {
    height: '42px',
    display: 'flex',
    alignItems: 'center',
    marginTop: theme.spacing(1)
  },
  spacer: {
    flexGrow: 1
  },
  importButton: {
    marginRight: theme.spacing(1)
  },
  exportButton: {
    marginRight: theme.spacing(1)
  },
  searchInput: {
    marginRight: theme.spacing(1)
  }
}));

const UsersToolbar = props => {
  const { className, ...rest } = props;

  const classes = useStyles();

  return (
    <div
      {...rest}
      className={clsx(classes.root, className)}
    >
      <div className={classes.row}>
        <span className={classes.spacer} />
      </div>
      <div className={classes.row}>

        <Grid container>

          <Grid item md={4}>
            <TextField
              className={classes.searchInput}
              placeholder="Título da tarefa"
              label="Título:"
              fullWidth
            />
          </Grid>

          <Grid item md={4}>
            <TextField
              className={classes.searchInput}
              placeholder="Descrição da tarefa"
              label="Descrição:"
              fullWidth
            />
          </Grid>

          <Grid item md={4}>
            <TextField
              className={classes.searchInput}
              placeholder="Categoria da tarefa"
              label="Categoria:"
              fullWidth
            />
          </Grid>

          <Grid>
            <Button variant="contained" color="secondary">Adicionar</Button>
          </Grid>

        </Grid>

      </div>
    </div>
  );
};

UsersToolbar.propTypes = {
  className: PropTypes.string
};

export default UsersToolbar;
