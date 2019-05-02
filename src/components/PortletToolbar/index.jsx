import React, { Component } from 'react';

// Externals
import classNames from 'classnames';
import PropTypes from 'prop-types';

// Material helpers
import { withStyles } from '@material-ui/core/styles';

const styles = () => ({
  root: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    display: 'flex'
  }
});

class PortletToolbar extends Component {
  render() {
    const { classes, className, children, ...rest } = this.props;

    const rootClassName = classNames(classes.root, className);

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

PortletToolbar.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(PortletToolbar);
