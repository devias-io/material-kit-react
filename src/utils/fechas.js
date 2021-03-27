/* eslint-disable no-use-before-define */
/* eslint-disable import/prefer-default-export */
/* eslint-disable camelcase */
/* eslint-disable no-undef */
export function fecha_actual() {
  const date = new Date();
  const ano = date.getFullYear();
  let mes = date.getMonth() + 1;
  let dia = date.getDate();

  mes = agregar_ceros_mes(mes);
  dia = agregar_ceros_dia(dia);

  return `${ano}-${mes}-${dia}`;
}

function agregar_ceros_mes(mes) {
  if (mes < 10) {
    return `${0}${mes}`;
  }
  return mes;
}

function agregar_ceros_dia(dia) {
  if (dia < 10) {
    return `${0}${dia}`;
  }
  return dia;
}
