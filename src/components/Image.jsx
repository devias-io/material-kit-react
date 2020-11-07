import React from 'react';
import { makeStyles, createStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(() =>
  createStyles({
    image: {
      width: styles => styles.width ?? '350px'
    }
  })
);

const CustomImage = ({ styles, alt, src, ...props }) => {
  const classes = useStyles(styles);
  return <img className={classes.image} {...props} alt={alt} src={src} />;
};

export default CustomImage;
