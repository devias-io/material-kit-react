import React, { Component } from 'react';

// Externals
import PropTypes from 'prop-types';
import classNames from 'classnames';

// Material helpers
import { withStyles } from '@material-ui/core/styles';

// Material components
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import AccessTimeOutlinedIcon from '@material-ui/icons/AccessTimeOutlined';
import GetAppIcon from '@material-ui/icons/GetApp';

// Shared components
import Paper from 'components/Paper';
import Status from 'components/Status';

// Component styles
import styles from './styles';

const statusColors = {
  published: 'success',
  archived: 'neutral',
  draft: 'warning'
};

class ProductCard extends Component {
  render() {
    const { classes, className, product } = this.props;

    const rootClassName = classNames(classes.root, className);

    return (
      <Paper className={rootClassName}>
        <div className={classes.statusWrapper}>
          <Status
            className={classes.status}
            color={statusColors[product.status]}
            size="sm"
          />
          <Typography
            className={classes.statusText}
            variant="body2"
          >
            {product.status}
          </Typography>
        </div>
        <div className={classes.imageWrapper}>
          <img
            alt="Product"
            className={classes.image}
            src={product.imageUrl}
          />
        </div>
        <div className={classes.details}>
          <Typography
            className={classes.title}
            variant="h4"
          >
            {product.title}
          </Typography>
          <Typography
            className={classes.description}
            variant="body1"
          >
            {product.description}
          </Typography>
        </div>
        <Divider />
        <div className={classes.stats}>
          <AccessTimeOutlinedIcon className={classes.updateIcon} />
          <Typography
            className={classes.updateText}
            variant="body2"
          >
            Updated 2hr ago
          </Typography>
          <GetAppIcon className={classes.downloadsIcon} />
          <Typography
            className={classes.downloadsText}
            variant="body2"
          >
            {product.totalDownloads} Downloads
          </Typography>
        </div>
      </Paper>
    );
  }
}

ProductCard.propTypes = {
  className: PropTypes.string,
  classes: PropTypes.object.isRequired,
  product: PropTypes.object.isRequired
};

export default withStyles(styles)(ProductCard);
