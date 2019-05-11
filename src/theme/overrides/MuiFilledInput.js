// Colors
import { primary } from '../../common/colors';
import palette from '../palette';

export default {
  root: {
    backgroundColor: palette.background.default,
    '&:hover': {
      backgroundColor: primary.light
    },
    '&$focused': {
      backgroundColor: primary.light
    }
  }
};
