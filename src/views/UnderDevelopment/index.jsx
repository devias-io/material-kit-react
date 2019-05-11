import React, { Component } from 'react';

// Externals
import PropTypes from 'prop-types';

// Material helpers
import { withStyles } from '@material-ui/core';

// Material components
import { Grid, Typography } from '@material-ui/core';

// Component styles
const styles = theme => ({
  root: {
    padding: theme.spacing.unit * 4
  },
  content: {
    marginTop: '150px',
    textAlign: 'center'
  },
  image: {
    display: 'inline-block',
    marginTop: '50px',
    maxWidth: '100%',
    width: '554px'
  }
});

class UnderDevelopment extends Component {
  render() {
    const { classes } = this.props;

    return (
      <div className={classes.root}>
        <Grid
          container
          justify="center"
          spacing={4}
        >
          <Grid
            item
            lg={6}
            xs={12}
          >
            <div className={classes.content}>
              <Typography variant="h1">Page Under Development</Typography>
              <Typography variant="subtitle2">
                We are still developing this page, please visit repo at
                github.com/repo/aesthetic-material
              </Typography>
              <img
                alt="Under development"
                className={classes.image}
                src="/images/under_development.png"
              />
            </div>
          </Grid>
        </Grid>
      </div>
    );
  }
}

UnderDevelopment.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(UnderDevelopment);
