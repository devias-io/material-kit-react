import React from 'react';

// Externals
import PropTypes from 'prop-types';
import classNames from 'classnames';

// Material helpers
import { withStyles } from '@material-ui/core';

// Material components
import { List as ListIcon, Apps as AppsIcon } from '@material-ui/icons';

// Component styles
import styles from './styles';

const DisplayMode = props => {
  const { classes, className, mode, onChange } = props;

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
        <AppsIcon className={classes.displayIcon} />
      </span>
      <span className={classes.divider} />
      <span
        className={classNames({
          [classes.option]: true,
          [classes.optionSelected]: mode === 'list'
        })}
        onClick={onChange}
      >
        <ListIcon className={classes.displayIcon} />
      </span>
    </div>
  );
};

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
