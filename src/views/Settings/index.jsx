import React, { Component } from 'react';

// Externals
import PropTypes from 'prop-types';

// Material helpers
import { withStyles } from '@material-ui/core/styles';

// Material components
import Grid from '@material-ui/core/Grid';

// Shared layouts
import DashboardLayout from 'layouts/Dashboard';

// Custom components
import Notifications from './components/Notifications';
import Password from './components/Password';

// Component styles
const styles = theme => ({
  root: {
    padding: theme.spacing.unit * 4
  }
});

class Settings extends Component {
  render() {
    const { classes } = this.props;

    return (
      <DashboardLayout title="Settings">
        <div className={classes.root}>
          <Grid
            container
            spacing={32}
          >
            <Grid
              item
              md={7}
              xs={12}
            >
              <Notifications />
            </Grid>
            <Grid
              item
              md={5}
              xs={12}
            >
              <Password />
            </Grid>
          </Grid>
        </div>
      </DashboardLayout>
    );
  }
}

Settings.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Settings);
