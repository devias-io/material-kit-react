/* eslint-disable camelcase */
/* eslint-disable no-tabs */
/* eslint-disable import/prefer-default-export */
/* eslint-disable no-mixed-spaces-and-tabs */
import moment from 'moment';

export function calculaEdad(fecha, fecha_nac) {
  const a = moment(fecha);
  const b = moment(fecha_nac);

  const years = a.diff(b, 'year');
  b.add(years, 'years');

  const months = a.diff(b, 'months');
  b.add(months, 'months');

  const days = a.diff(b, 'days');

  if (years === 0) {
    if (months <= 1) {
      if (days <= 1) {
        return `${months} mes ${days} dia`;
	  }
      return `${months} mes ${days} dias`;
	   } if (days <= 1) {
			   return `${months} meses ${days} dia`;
    }
			   return `${months} meses ${days} dias`;
  } if (years === 1) {
    return `${years} año`;
	    }
  return `${years} años`;
}
