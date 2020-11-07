import React from 'react';
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
      maxWidth: '500px'
    },
    bodytext: {
      fontSize: '1.15rem'
    }
  })
);

const Event = ({ data }) => {
  const classes = useStyles();
  return (
    <Card className={classes.card} elevation={8}>
      {data.logo?.original?.url ? (
        <Image styles={{ width: '100%' }} src={data.logo.original.url} />
      ) : (
        <Image src="/assets/placeholder.jpg" />
      )}
      <CardContent>
        <Typography variant="h4">{data.name.text}</Typography>
        <Typography variant="h5">{data.description.text}</Typography>
        <Typography variant="h5">
          {new Date(data.start.utc).toLocaleDateString()}
        </Typography>
      </CardContent>
      <CardActions>
        <Button onClick={() => (document.location = data.url)}>Sign up</Button>
      </CardActions>
    </Card>
  );
};

export default Event;
