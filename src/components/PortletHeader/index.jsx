import React from 'react';

// Externals
import PropTypes from 'prop-types';
import classNames from 'classnames';

// Material helpers
import { withStyles } from '@material-ui/core';

// Component styles
const styles = theme => ({
  root: {
    alignItems: 'center',
    borderBottom: `1px solid ${theme.palette.border}`,
    borderTopLeftRadius: '2px',
    borderTopRightRadius: '2px',
    display: 'flex',
    height: '64px',
    justifyContent: 'space-between',
    paddingLeft: theme.spacing.unit * 3,
    paddingRight: theme.spacing.unit * 3,
    position: 'relative'
  },
  noDivider: {
    borderBottom: 'none'
  },
  noPadding: {
    padding: 0
  }
});

const PortletHeader = props => {
  const { classes, className, noDivider, noPadding, children, ...rest } = props;

  const rootClassName = classNames(
    {
      [classes.root]: true,
      [classes.noDivider]: noDivider,
      [classes.noPadding]: noPadding
    },
    className
  );

  return (
    <div
      {...rest}
      className={rootClassName}
    >
      {children}
    </div>
  );
};

PortletHeader.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  classes: PropTypes.object.isRequired,
  noDivider: PropTypes.bool,
  noPadding: PropTypes.bool
};

export default withStyles(styles)(PortletHeader);
