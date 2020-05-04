import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/styles';
import { Link as RouterLink} from 'react-router-dom';
import { Button } from '@material-ui/core';

import { SearchInput } from 'components';

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
  editarButton: {
    marginRight: theme.spacing(1)
  },
  excluirButton: {
    marginRight: theme.spacing(1)
  },
  searchInput: {
    marginRight: theme.spacing(1)
  }
}));

const FornecedoresToolbar = props => {
  const { className, ...rest } = props;

  const classes = useStyles();

  return (
    <div
      {...rest}
      className={clsx(classes.root, className)}
    >
      <div className={classes.row}>
        <span className={classes.spacer} />
        <Button className={classes.editarButton}>Editar</Button>
        <Button className={classes.excluirButton}>Excluir</Button>
        <Button 
          component={RouterLink}
          to="/AddFornecedor"
          color="primary"
          variant="contained"
        >
          Adicionar fornecedor
        </Button>
      </div>
      <div className={classes.row}>
        <SearchInput
          className={classes.searchInput}
          placeholder="Procurar fornecedor"
        />
      </div>
    </div>
  );
};

FornecedoresToolbar.propTypes = {
  className: PropTypes.string
};

export default FornecedoresToolbar;
