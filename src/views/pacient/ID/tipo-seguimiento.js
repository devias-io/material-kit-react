/* eslint-disable max-len */
/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import {
  InputLabel,
  FormControl,
  Select,
  Typography,
  Box,
  MenuItem,
} from '@material-ui/core';
import FromCategory from '../seguimiento/form-category';

const TipoSeguimiento = ({ select, idPacient, setActualizarSeguimiento }) => {
  const [SelectMucosa, setSelectMucosa] = useState(false);
  const [newSelect, setNewSelect] = useState('');

  useEffect(() => {
    if (select === 'Mucosas') {
      setSelectMucosa(true);
    }
  }, [select]);
  return (
    <>
      {SelectMucosa ? (
        <>
          <Box mb={3}>
            <Typography
              color="textPrimary"
              variant="h2"
            >
              Mucosas
            </Typography>
            <Typography
              color="textSecondary"
              gutterBottom
              variant="body2"
            >
              Categoria de Mucosas
            </Typography>
          </Box>
          <FormControl style={{ width: 200, marginBottom: 10 }}>
            <InputLabel id="demo-simple-select-label">Categoria</InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              onChange={(e) => {
                setNewSelect(`Muscosas - ${e.target.value}`);
                setSelectMucosa(false);
              }}
            >
              <MenuItem value="Conjuntival">Conjuntival</MenuItem>
              <MenuItem value="Oral">Oral</MenuItem>
              <MenuItem value="Oido">Oido</MenuItem>
              <MenuItem value="Nodulos Linfaticos">Nodulos Linfaticos</MenuItem>
              <MenuItem value="Piel y Anexos">Piel y Anexos</MenuItem>
              <MenuItem value="Sistema nervioso">Sistema nervioso</MenuItem>
              <MenuItem value="Sistema nervioso">Sistema nervioso</MenuItem>
              <MenuItem value="A.Cardiovascular">A.Cardiovascular</MenuItem>
              <MenuItem value="A.Respiratorio">A.Respiratorio</MenuItem>
              <MenuItem value="A.Digestivo">A.Digestivo</MenuItem>
            </Select>
          </FormControl>
        </>
      ) : (
        <FromCategory select={newSelect || select} idPacient={idPacient} setActualizarSeguimiento={setActualizarSeguimiento} />
      )}
    </>
  );
};

export default TipoSeguimiento;
