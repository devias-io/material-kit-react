import React from 'react';

// Material helpers
import { withStyles } from '@material-ui/core';

// Shared layouts
import { Dashboard as DashboardLayout } from 'layouts';

// Component styles
const styles = theme => ({
  root: {
    padding: theme.spacing.unit * 4
  },
  item: {
    height: '100%'
  }
});

const FinanceHome = (props) => {
  const { classes } = props;

  return (
    <DashboardLayout title="Finance Home">
      <div className={classes.root}>
        <h1>Finance Home Content</h1>
        <p>This is a placeholder for the Finance Home page.</p>
      </div>
    </DashboardLayout>
  );
};

export default withStyles(styles)(FinanceHome);
