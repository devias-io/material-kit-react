// Palette
import palette from '../palette';

export default {
  root: {
    height: '56px',
    '&$selected': {
      backgroundColor: palette.background.default
    },
    '&$hover': {
      '&:hover': {
        backgroundColor: palette.background.default
      }
    }
  }
};
