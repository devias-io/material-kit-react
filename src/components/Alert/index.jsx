import React, { Component } from 'react';

// Externals
import PropTypes from 'prop-types';
import classNames from 'classnames';

// Material helpers
import { withStyles } from '@material-ui/core/styles';

// Material components
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';

import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import InfoIcon from '@material-ui/icons/Info';
import WarningIcon from '@material-ui/icons/Warning';
import ErrorIcon from '@material-ui/icons/Error';
import CloseIcon from '@material-ui/icons/Close';

// Component styles
import styles from './styles';

class Alert extends Component {
  getIconForIntent = intent => {
    const map = {
      success: <CheckCircleIcon />,
      info: <InfoIcon />,
      warning: <WarningIcon />,
      danger: <ErrorIcon />
    };

    return map[intent];
  };

  render() {
    const {
      classes,
      className,
      intent,
      hasIcon,
      isRemoveable,
      title,
      description,
      onRemove,
      ...rest
    } = this.props;

    const rootClassName = classNames(
      {
        [classes.root]: true,
        [classes[intent]]: intent
      },
      className
    );

    return (
      <div
        {...rest}
        className={rootClassName}
      >
        {hasIcon && (
          <div className={{}}>
            <span className={classes.intentIcon}>
              {this.getIconForIntent(intent)}
            </span>
          </div>
        )}
        <div className={classes.content}>
          {title && (
            <Typography
              className={classes.title}
              variant="h5"
            >
              {title}
            </Typography>
          )}
          {description && (
            <Typography
              className={classes.description}
              variant="subtitle2"
            >
              {description}
            </Typography>
          )}
        </div>
        {isRemoveable && (
          <div className={classes.remove}>
            <IconButton onClick={onRemove}>
              <CloseIcon className={classes.removeIcon} />
            </IconButton>
          </div>
        )}
      </div>
    );
  }
}

Alert.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  classes: PropTypes.object.isRequired,
  description: PropTypes.string,
  hasIcon: PropTypes.bool,
  intent: PropTypes.string,
  isRemoveable: PropTypes.bool,
  onRemove: PropTypes.func,
  title: PropTypes.string
};

Alert.defaultProps = {
  intent: 'success',
  hasIcon: true,
  isRemoveable: true,
  onRemove: () => {}
};

export default withStyles(styles)(Alert);
