import { Helmet } from 'react-helmet';
import { Box, Container } from '@material-ui/core';
import Notifications from './Notifications';
import Password from './Password';

const SettingsView = () => (
  <>
    <Helmet>
      <title>Settings</title>
    </Helmet>
    <Box
      sx={{
        backgroundColor: 'background.default',
        minHeight: '100%',
        py: 3
      }}
    >
      <Container maxWidth="lg">
        <Notifications />
        <Box sx={{ pt: 3 }}>
          <Password />
        </Box>
      </Container>
    </Box>
  </>
);

export default SettingsView;
