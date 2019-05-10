import React, { Component } from 'react';

// Externals
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { Bar } from 'react-chartjs-2';

// Material helpers
import { withStyles } from '@material-ui/core/styles';

// Material components
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';

// Shared components
import Portlet from 'components/Portlet';
import PortletContent from 'components/PortletContent';
import PortletFooter from 'components/PortletFooter';

// Palette
import palette from 'theme/palette';

// Chart configuration
import { data, options } from './chart';

// Component styles
import styles from './styles';

class SalesChart extends Component {
  render() {
    const { classes, className, ...rest } = this.props;

    const rootClassName = classNames(classes.root, className);

    return (
      <Portlet
        {...rest}
        className={rootClassName}
      >
        <PortletContent>
          <Typography variant="h1">12.370</Typography>
          <Typography variant="body1">total sales</Typography>
          <div className={classes.chartWrapper}>
            <Bar
              data={data}
              options={options}
            />
          </div>
        </PortletContent>
        <PortletFooter className={classes.portletFooter}>
          <Button
            size="small"
            variant="text"
          >
            Last 7 days <ArrowDropDownIcon />
          </Button>
          <Button
            color="primary"
            size="small"
            variant="text"
          >
            Sales overview <ArrowRightIcon />
          </Button>
        </PortletFooter>
      </Portlet>
    );
  }
}

SalesChart.propTypes = {
  className: PropTypes.string,
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(SalesChart);
