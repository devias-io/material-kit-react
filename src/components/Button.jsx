import React from 'react';
import Button from '@material-ui/core/Button';
import { makeStyles, createStyles } from '@material-ui/core/styles';


const useStyles = makeStyles(() =>
  createStyles({
    btn: {
      borderRadius: '5px'
    }
  })
);

const MyButton = ({ children, ...props }) => {
  const classes = useStyles();
  return (
    <Button
      className={classes.btn}
      variant="contained"
      color="primary"
      {...props}
    >
      {children}
    </Button>
  );
};

export default MyButton;
