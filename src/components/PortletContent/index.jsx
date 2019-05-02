import React, { Component } from 'react';

// Externals
import PropTypes from 'prop-types';
import classNames from 'classnames';

// Material helpers
import { withStyles } from '@material-ui/core/styles';

// Component styles
const styles = theme => ({
  root: {
    paddingLeft: theme.spacing.unit * 3,
    paddingRight: theme.spacing.unit * 3,
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
    flexGrow: 1
  },
  noPadding: {
    padding: 0
  }
});

class PortletContent extends Component {
  render() {
    const { classes, className, children, noPadding, ...rest } = this.props;

    const rootClassName = classNames(
      {
        [classes.root]: true,
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
  }
}

PortletContent.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  classes: PropTypes.object.isRequired,
  noPadding: PropTypes.bool
};

export default withStyles(styles)(PortletContent);
