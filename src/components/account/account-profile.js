import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Divider,
  Typography,
  Theme
} from '@mui/material';

const user = {
  avatar: '/static/images/avatars/avatar_6.png',
  city: 'Los Angeles',
  country: 'USA',
  jobTitle: 'Senior Developer',
  name: 'Katarina Smith',
  timezone: 'GTM-7'
};

let classNameHolder = ["primary.main","secondary.main","error.main"];
export const AccountProfile = (props) => (
  <Card {...props}>
    <CardContent>
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Avatar
          sx={{
            bgcolor : "error.main",
            height: 64,
            mb: 2,
            width: 64
          }}
        >
          { props.name[0]}
        </Avatar>
        <Typography
          color="textPrimary"
          gutterBottom
          variant="h5"
        >
          {props.name}
        </Typography>
        <Typography
          color="textSecondary"
          variant="body2"
        >
          {`${props.email}`}
        </Typography>
        <Typography
          color="textSecondary"
          variant="body2"
        >
          KGX innovation
        </Typography>
      </Box>
    </CardContent>
    <Divider />
  </Card>
);
