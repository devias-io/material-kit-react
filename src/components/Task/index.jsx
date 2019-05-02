import React, { Component } from 'react';

// Externals
import PropTypes from 'prop-types';
import classNames from 'classnames';

// Material helpers
import { withStyles } from '@material-ui/core/styles';

// Material components
import Typography from '@material-ui/core/Typography';

// Shared components
import Status from 'components/Status';

// Component styles
import styles from './styles';

const statusColors = {
  pending: 'neutral',
  progress: 'warning',
  done: 'success'
};

class Task extends Component {
  render() {
    const {
      classes,
      className,
      title,
      desc,
      status,
      color,
      ...rest
    } = this.props;

    const rootClassName = classNames(
      {
        [classes.root]: true,
        [classes[color]]: color
      },
      className
    );

    return (
      <div
        {...rest}
        className={rootClassName}
      >
        <div className={classes.details}>
          <Typography variant="h6">{title}</Typography>
          <Typography variant="caption">{desc}</Typography>
        </div>
        <Status color={statusColors[status]} />
      </div>
    );
  }
}

Task.propTypes = {
  className: PropTypes.string,
  classes: PropTypes.object.isRequired,
  color: PropTypes.oneOf(['primary', 'info', 'success', 'warning', 'danger']),
  desc: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['pending', 'progress', 'done']),
  title: PropTypes.string.isRequired
};

Task.defaultProps = {
  color: 'primary',
  status: 'pending'
};

export default withStyles(styles)(Task);
