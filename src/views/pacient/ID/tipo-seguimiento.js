/* eslint-disable react/prop-types */
import React from 'react';

const TipoSeguimiento = ({ select }) => {
  return (
    <>
      {select === 'Alimentacion' && 'Alimentacion'}
      {select === 'Reproduccion' && 'Reproduccion'}
      {select === 'Habitat' && 'Habitat'}
      {select === 'Enfermedades' && 'Enfermedades'}
      {select === 'Alergias' && 'Alergias'}
      {select === 'Antecedentes' && 'Antecedentes'}
    </>
  );
};

export default TipoSeguimiento;
