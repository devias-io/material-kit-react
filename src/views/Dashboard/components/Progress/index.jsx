import React, { Component } from 'react';

// Externals
import classNames from 'classnames';
import PropTypes from 'prop-types';

// Material helpers
import { withStyles } from '@material-ui/core/styles';

// Material components
import Typography from '@material-ui/core/Typography';
import LinearProgress from '@material-ui/core/LinearProgress';
import TimelineOutlinedIcon from '@material-ui/icons/TimelineOutlined';

// Shared components
import Paper from 'components/Paper';

// Component styles
import styles from './styles';

class Progress extends Component {
  render() {
    const { classes, className, ...rest } = this.props;

    const rootClassName = classNames(classes.root, className);

    return (
      <Paper
        {...rest}
        className={rootClassName}
      >
        <div className={classes.content}>
          <Typography
            className={classes.title}
            variant="body2"
          >
            PROGRESS
          </Typography>
          <div className={classes.details}>
            <Typography variant="h3">75.5%</Typography>
            <div className={classes.progressWrapper}>
              <LinearProgress
                value={75.5}
                variant="determinate"
              />
            </div>
          </div>
        </div>
        <div className={classes.iconWrapper}>
          <TimelineOutlinedIcon className={classes.icon} />
        </div>
      </Paper>
    );
  }
}

Progress.propTypes = {
  className: PropTypes.string,
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Progress);
