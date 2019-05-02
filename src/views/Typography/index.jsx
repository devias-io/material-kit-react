import React, { Component } from 'react';

// Externals
import PropTypes from 'prop-types';

// Material helpers
import { withStyles } from '@material-ui/core/styles';

// Material components
import TypographyC from '@material-ui/core/Typography';

// Shared layouts
import DashboardLayout from 'layouts/Dashboard';

// Component styles
const styles = theme => ({
  root: {
    padding: theme.spacing.unit * 4
  },
  row: {
    display: 'flex',
    // flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: '50px'
  },
  caption: {
    flexBasis: '320px',
    flexShrink: 0,
    flexGrow: 0
  },
  example: {
    flexGrow: 1
  }
});

const variants = {
  h1: 'Nisi euismod ante senectus consequat phasellus ut',
  h2: 'Nisi euismod ante senectus consequat phasellus ut',
  h3: 'Nisi euismod ante senectus consequat phasellus ut',
  h4: 'Nisi euismod ante senectus consequat phasellus ut',
  h5: 'Nisi euismod ante senectus consequat phasellus ut',
  h6: 'Nisi euismod ante senectus consequat phasellus ut',
  subtitle1: 'Leo varius justo aptent arcu urna felis pede nisl',
  subtitle2: 'Leo varius justo aptent arcu urna felis pede nisl',
  body1:
    'Justo proin curabitur dictumst semper auctor, consequat tempor, nostra aenean neque turpis nunc. Leo. Sapien aliquet facilisi turpis, elit facilisi praesent porta metus leo. Dignissim amet dis nec ac integer inceptos erat dis Turpis sodales ad torquent. Dolor, erat convallis.Laoreet velit a fames commodo tristique hendrerit sociosqu rhoncus vel sapien penatibus facilisis faucibus ad. Mus purus vehicula imperdiet tempor lectus, feugiat Sapien erat viverra netus potenti mattis purus turpis. Interdum curabitur potenti tristique. Porta velit dignissim tristique ultrices primis.',
  body2:
    'Justo proin curabitur dictumst semper auctor, consequat tempor, nostra aenean neque turpis nunc. Leo. Sapien aliquet facilisi turpis, elit facilisi praesent porta metus leo. Dignissim amet dis nec ac integer inceptos erat dis Turpis sodales ad torquent. Dolor, erat convallis.',
  caption: 'Accumsan leo pretium conubia ullamcorper.',
  button: 'Vivamus ultrices rutrum fames dictumst'
};

class Typography extends Component {
  render() {
    const { classes } = this.props;

    return (
      <DashboardLayout title="Typography">
        <div className={classes.root}>
          {Object.keys(variants).map((key, i) => (
            <div
              className={classes.row}
              key={i}
            >
              <TypographyC
                className={classes.caption}
                variant="caption"
              >
                {key}
              </TypographyC>
              <TypographyC
                className={classes.example}
                variant={key}
              >
                {variants[key]}
              </TypographyC>
            </div>
          ))}
        </div>
      </DashboardLayout>
    );
  }
}

Typography.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Typography);
