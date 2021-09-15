import { Box, Container } from '@material-ui/core';
import SettingsNotifications from '../components/settings/SettingsNotifications';
import SettingsPassword from '../components/settings/SettingsPassword';

const SettingsView = () => (
  <>
    <Box
      sx={{
        backgroundColor: 'background.default',
        minHeight: '100%',
        py: 3
      }}
    >
      <Container maxWidth="lg">
        <SettingsNotifications />
        <Box sx={{ pt: 3 }}>
          <SettingsPassword />
        </Box>
      </Container>
    </Box>
  </>
);

export default SettingsView;
