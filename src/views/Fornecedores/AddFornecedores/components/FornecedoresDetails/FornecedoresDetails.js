import React, { useState } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/styles';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Divider,
  Grid,
  Button,
  TextField
} from '@material-ui/core';

const useStyles = makeStyles(() => ({
  root: {}
}));

const FornecedoresDetails = props => {
  const { className, ...rest } = props;

  const classes = useStyles();

  const [values, setValues] = useState({
    nome: '',
    numero: '',
    email: '',
    telefone: '',
    state: '',
    endereco: '',
    cidade: ''
  });

  const handleChange = event => {
    setValues({
      ...values,
      [event.target.name]: event.target.value
    });
  };

  const states = [

    {
      value: "AC",
      label: "Acre"
    },
         {
      value: "AL",
      label: "Alagoas"
    },
         {
      value: "AM",
      label: "Amazonas"
    },
         {
      value: "AP",
      label: "Amapá"
    },
         {
      value: "BA",
      label: "Bahia"
    },
         {
      value: "CE",
      label: "Ceará"
    },
         {
      value: "DF",
      label: "Distrito Federal"
    },
         {
      value: "ES",
      label: "Espírito Santo"
    },
         {
      value: "GO",
      label: "Goiás"
    },
         {
      value: "MA",
      label: "Maranhão"
    },
         {
      value: "MG",
      label: "Minas Gerais"
    },
         {
      value: "MS",
      label: "Mato Grosso do Sul"
    },
         {
      value: "MT",
      label: "Mato Grosso"
    },
         {
      value: "PA",
      label: "Pará"
    },
         {
      value: "PB",
      label: "Paraíba"
    },
         {
      value: "PE",
      label: "Pernambuco"
    },
         {
      value: "PI",
      label: "Piauí"
    },
         {
      value: "PR",
      label: "Paraná"
    },
         {
      value: "RJ",
      label: "Rio de Janeiro"
    },
         {
      value: "RN",
      label: "Rio Grande do Norte"
    },
         {
      value: "RO",
      label: "Rondônia"
    },
         {
      value: "RR",
      label: "Roraima"
    },
         {
      value: "RS",
      label: "Rio Grande do Sul"
    },
         {
      value: "SC",
      label: "Santa Catarina"
    },
         {
      value: "SE",
      label: "Sergipe"
    },
         {
      value: "SP",
      label: "São Paulo"
    },
         {
      value: "TO",
      label: "Tocantins"
    }
  ];

  return (
    <Card
      {...rest}
      className={clsx(classes.root, className)}
    >
      <form
        autoComplete="off"
        noValidate
      >
        <CardHeader
          subheader="Incluir informações"
          title="Perfil"
        />
        <Divider />
        <CardContent>
          <Grid
            container
            spacing={3}
          >
            <Grid
              item
              md={6}
              xs={12}
            >
              <TextField
                fullWidth
                // helperText="Especifique o seu primeiro nome"
                label="Nome"
                margin="dense"
                name="nome"
                onChange={handleChange}
                required
                value={values.nome}
                variant="outlined"
              />
            </Grid>


            <Grid
              item
              md={6}
              xs={12}
            >
              <TextField
                fullWidth
                label="Número de Telefone"
                margin="dense"
                name="numero"
                onChange={handleChange}
                type="number"
                value={values.numero}
                variant="outlined"
              />
            </Grid>

            <Grid
              item
              md={6}
              xs={12}
            >
              <TextField
                fullWidth
                label="E-mail"
                margin="dense"
                name="email"
                onChange={handleChange}
                required
                value={values.email}
                variant="outlined"
              />
            </Grid>

            

            <Grid
              item
              md={6}
              xs={12}
            >
              <TextField
                fullWidth
                label="Endereço"
                margin="dense"
                name="endereco"
                onChange={handleChange}
                required
                value={values.endereco}
                variant="outlined"
              />
            </Grid>
            
            <Grid
              item
              md={6}
              xs={12}
            >
              <TextField
                fullWidth
                // label="Estado"
                margin="dense"
                name="state"
                onChange={handleChange}
                required
                select
                // eslint-disable-next-line= {react/jsx-sort-props} 
                SelectProps={{ native: true }}
                value={values.state}
                variant="outlined"
              >
                {
                  states.map(option => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))
                }
              </TextField>


            </Grid>
            <Grid
              item
              md={6}
              xs={12}
            >
              <TextField
                fullWidth
                label="Cidade"
                margin="dense"
                name="cidade"
                onChange={handleChange}
                required
                value={values.cidade}
                variant="outlined"
              />
            </Grid>

            
          </Grid>
        </CardContent>
        <Divider />
        <CardActions>
          <Button
            color="primary"
            variant="contained"
          >
            Salvar
          </Button>
        </CardActions>
      </form>
    </Card>
  );
};

FornecedoresDetails.propTypes = {
  className: PropTypes.string
};

export default FornecedoresDetails;
