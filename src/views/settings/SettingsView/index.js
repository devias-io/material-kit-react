import { Helmet } from 'react-helmet';
import {
  Box,
  Container,
  makeStyles
} from '@material-ui/core';
import Notifications from './Notifications';
import Password from './Password';

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.default,
    minHeight: '100%',
    paddingBottom: theme.spacing(3),
    paddingTop: theme.spacing(3)
  }
}));

const SettingsView = () => {
  const classes = useStyles();

  return (
    <>
      <Helmet>
        <title>Settings</title>
      </Helmet>
      <Box className={classes.root}>
        <Container maxWidth="lg">
          <Notifications />
          <Box sx={{ pt: 3 }}>
            <Password />
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default SettingsView;
