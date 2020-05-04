import React, {useState} from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/styles';
import { 

  Button,
  TextField,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel
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

const PedidosToolbar = props => {
  const { className, ...rest } = props;

  const [cliente, setCliente] = useState('');
  const [produto, setProduto] = useState('');


  const classes = useStyles();

  const submit = (event) =>{
    event.preventDefault();
    const pedido = {
      cliente : cliente,
      produto : produto
    }
    props.salvar(pedido)  
    setProduto('')
    setCliente('')
  }

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
            placeholder="Nome do cliente"
            label = "Cliente:"
            fullWidth={true}
            value={cliente}
            onChange={e => setCliente(e.target.value)}
            // variant="outlined"
          />

          </Grid>

          <Grid item md={4}>
          <FormControl fullWidth={true}>
            <InputLabel> Produto: </InputLabel>
            <Select value={produto} onChange={e => setProduto(e.target.value)}> 
              <MenuItem value="">Selecione...</MenuItem>
              <MenuItem value={"TRABALHO"}>PRODUTO 1</MenuItem>
              <MenuItem value={"ESTUDOS"}>PRODUTO 2</MenuItem>
              <MenuItem value={"OUTROS"}>PRODUTO 3</MenuItem>
            </Select>
          </FormControl>
          </Grid>

          <Grid item md={2}>
            <Button onClick={submit}variant="contained" color="secondary">
              Adicionar
            </Button>
          </Grid>

        </Grid>
      </div>
    </div>
  );
};

PedidosToolbar.propTypes = {
  className: PropTypes.string
};

export default PedidosToolbar;
