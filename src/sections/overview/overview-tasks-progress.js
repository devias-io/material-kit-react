import PropTypes from 'prop-types';
import ListBulletIcon from '@heroicons/react/24/solid/ListBulletIcon';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Stack,
  SvgIcon,
  Typography
} from '@mui/material';

export const OverviewTasksProgress = (props) => {
  const { value, sx } = props;

  return (
    <Card className='card'
     sx={sx}>
      <CardContent className='card-content2'>
        <Stack
          alignItems="flex-start"
          direction="row"
          justifyContent="space-between"
          spacing={3}
        >
          <Stack spacing={1} 
          gap={'40%'}>
            <Typography
              color="text.secondary"
              gutterBottom
              variant="overline"
            >
             <div className='card-title'> Task Progress</div>
            </Typography>
            <Typography variant="h4" > 
              {value}%
            </Typography>
          </Stack>
          <Avatar
            sx={{
              backgroundColor: 'warning.main',
              height: 56,
              width: 56
            }}
          >
            <SvgIcon>
              <ListBulletIcon />
            </SvgIcon>
          </Avatar>
        </Stack>
        <Box sx={{ mt: 3 }}>
          <LinearProgress
            value={value}
            variant="determinate"
          />
        </Box>
      </CardContent>
    </Card>
  );
};

OverviewTasksProgress.propTypes = {
  value: PropTypes.number.isRequired,
  sx: PropTypes.object
};
