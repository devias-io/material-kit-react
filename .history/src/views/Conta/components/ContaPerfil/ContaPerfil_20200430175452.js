import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
// import moment from 'moment';
import { makeStyles } from '@material-ui/styles';
import {
  Card,
  CardContent,
  Typography,
  Divider,
  // CardActions,
  // Avatar,
  // Button,
  // LinearProgress
} from '@material-ui/core';

const useStyles = makeStyles(theme => ({
  root: {},
  details: {
    display: 'flex'
  },
  avatar: {
    marginLeft: 'auto',
    height: 110,
    width: 100,
    flexShrink: 0,
    flexGrow: 0
  },
  progress: {
    marginTop: theme.spacing(2)
  },
  uploadButton: {
    marginRight: theme.spacing(2)
  }
}));

const ContaPerfil = props => {
  const { className, ...rest } = props;

  const classes = useStyles();

  // const cliente = {
  //   name: 'Nome',
  //   city: 'Cidade',
  //   country: 'Estado',
  //   timezone: 'GTM-7',
  //   avatar: '/images/avatars/avatar_11.png'
  // };

  return (
    <Card
      {...rest}
      className={clsx(classes.root, className)}
    >
      <CardContent>
        <div className={classes.details}>
          <div>
            <Typography
              gutterBottom
              variant="h2"
            >
              Adicionar Novo Cliente
            </Typography>

            {/* <Typography
              className={classes.locationText}
              color="textSecondary"
              variant="body1"
            >
              {user.city}, {user.country}
            </Typography>
            <Typography
              className={classes.dateText}
              color="textSecondary"
              variant="body1"
            >
              {moment().format('hh:mm A')} ({user.timezone})
            </Typography> */}

          </div>

          {/* <Avatar
            className={classes.avatar}
            src={user.avatar}
          /> */}
        </div>

        {/* <div className={classes.progress}>
          <Typography variant="body1">Profile Completeness: 70%</Typography>
          <LinearProgress
            value={70}
            variant="determinate"
          />

        </div> */}
      </CardContent>
      <Divider />

      {/* <CardActions>
        <Button
          className={classes.uploadButton}
          color="primary"
          variant="text"
        >
          Adicionar foto
        </Button>
        <Button variant="text">Remover foto</Button>
      </CardActions> */}

    </Card>
  );
};

ContaPerfil.propTypes = {
  className: PropTypes.string
};

export default ContaPerfil;
