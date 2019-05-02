import React, { Component } from 'react';

// Externals
import PropTypes from 'prop-types';
import classNames from 'classnames';

// Material helpers
import { withStyles } from '@material-ui/core/styles';

// Material components
import ListOutlinedIcon from '@material-ui/icons/ListOutlined';
import AppsOutlinedIcon from '@material-ui/icons/AppsOutlined';

// Component styles
import styles from './styles';

class DisplayMode extends Component {
  render() {
    const { classes, className, mode, onChange } = this.props;

    const rootClassName = classNames(classes.root, className);

    return (
      <div className={rootClassName}>
        <span
          className={classNames({
            [classes.option]: true,
            [classes.optionSelected]: mode === 'grid'
          })}
          onClick={onChange}
        >
          <AppsOutlinedIcon className={classes.displayIcon} />
        </span>
        <span className={classes.divider} />
        <span
          className={classNames({
            [classes.option]: true,
            [classes.optionSelected]: mode === 'list'
          })}
          onClick={onChange}
        >
          <ListOutlinedIcon className={classes.displayIcon} />
        </span>
      </div>
    );
  }
}

DisplayMode.propTypes = {
  className: PropTypes.string,
  classes: PropTypes.object.isRequired,
  mode: PropTypes.oneOf(['grid', 'list']),
  onChange: PropTypes.func
};

DisplayMode.defaultProps = {
  mode: 'grid',
  onChange: () => {}
};

export default withStyles(styles)(DisplayMode);
