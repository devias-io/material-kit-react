import React from 'react';
import moment from 'moment';
import clsx from 'clsx';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Typography from '@material-ui/core/Typography';
import { makeStyles, createStyles } from '@material-ui/core/styles';

import { Image, Button } from '../../../components';

const useStyles = makeStyles(() =>
  createStyles({
    card: {
      minWidth: '300px',
      width: '100%',
      maxWidth: '650px'
    },
    imgContainer: {
      height: '250px',
      overflow: 'hidden'
    },
    caption: {
      opacity: '.8',
      fontSize: '1rem'
    },
    name: {
      marginBottom: '1rem'
    },
    desc: {
      marginBottom: '2rem'
    },
    actions: {
      padding: '8px 16px 20px'
    }
  })
);

const Event = ({ data }) => {
  const classes = useStyles();
  return (
    <Card className={classes.card} elevation={8}>
      <div className={classes.imgContainer}>
        {data.logo?.original?.url ? (
          <Image styles={{ width: '100%' }} src={data.logo.original.url} />
        ) : (
          <Image src="/assets/placeholder.jpg" />
        )}
      </div>
      <CardContent>
        <Typography variant="caption" className={classes.caption}>
          {formatDate(data.start.utc)}
        </Typography>
        <Typography variant="h5" className={classes.name}>
          {data.name.text}
        </Typography>
        <Typography className={clsx(classes.caption, classes.desc)}>
          {data.description.text}
        </Typography>
      </CardContent>
      <CardActions className={classes.actions}>
        <Button onClick={() => (document.location = data.url)}>
          Buy Tickets
        </Button>
      </CardActions>
    </Card>
  );
};

export default Event;

function formatDate(date) {
  const toString = moment(date).format('ddd, MMM D, LT');
  return toString;
}
