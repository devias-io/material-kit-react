// Palette
import palette from '../palette';

export default {
  root: {
    backgroundColor: palette.primary.light,
    color: '#425A70'
  },
  clickable: {
    '&:hover, &:focus, &:active': {
      backgroundColor: '#EDF0F2'
    }
  },
  deletable: {
    '&:focus': {
      backgroundColor: palette.primary.light
    }
  },
  outlined: {
    '&:hover': {
      backgroundColor: palette.primary.light
    }
  }
};
