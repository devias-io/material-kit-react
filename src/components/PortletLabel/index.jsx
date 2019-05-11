import React from 'react';

// Externals
import classNames from 'classnames';
import PropTypes from 'prop-types';

// Material helpers
import { withStyles } from '@material-ui/core';

// Material components
import { Typography } from '@material-ui/core';

const styles = theme => ({
  root: {
    display: 'flex',
    alignItems: 'center'
  },
  icon: {
    fontSize: '1.3rem',
    marginRight: theme.spacing.unit,
    color: theme.palette.text.secondary,
    alignItems: 'center',
    display: 'flex'
  },
  title: {
    fontWeight: 500
  },
  subtitle: {
    fontWeight: 400,
    marginLeft: theme.spacing.unit,
    color: theme.palette.text.secondary
  }
});

const PortletLabel = props => {
  const { classes, className, icon, title, subtitle, ...rest } = props;

  const rootClassName = classNames(classes.root, className);

  return (
    <div
      {...rest}
      className={rootClassName}
    >
      {icon && <span className={classes.icon}>{icon}</span>}
      {title && (
        <Typography
          className={classes.title}
          variant="h5"
        >
          {title}
        </Typography>
      )}
      {subtitle && (
        <Typography
          className={classes.subtitle}
          variant="subtitle2"
        >
          {subtitle}
        </Typography>
      )}
    </div>
  );
};

PortletLabel.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  classes: PropTypes.object.isRequired,
  icon: PropTypes.node,
  subtitle: PropTypes.string,
  title: PropTypes.string
};

export default withStyles(styles)(PortletLabel);
