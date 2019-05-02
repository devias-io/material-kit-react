import React, { Component } from 'react';

// Externals
import PropTypes from 'prop-types';
import classNames from 'classnames';

// Material helpers
import { withStyles } from '@material-ui/core/styles';

// Shared components
import Paper from '../Paper';

// Component styles
const styles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column'
  }
});

class Portlet extends Component {
  render() {
    const { classes, className, children, ...rest } = this.props;

    const rootClassName = classNames(classes.root, className);

    return (
      <Paper
        {...rest}
        className={rootClassName}
        elevation={0}
        outlined
        squared={false}
      >
        {children}
      </Paper>
    );
  }
}

Portlet.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Portlet);
