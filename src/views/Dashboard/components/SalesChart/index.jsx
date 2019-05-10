import React, { Component } from 'react';

// Externals
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { Bar } from 'react-chartjs-2';

// Material helpers
import { withStyles } from '@material-ui/core/styles';

// Material components
import Button from '@material-ui/core/Button';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';

// Shared components
import Portlet from 'components/Portlet';
import PortletHeader from 'components/PortletHeader';
import PortletLabel from 'components/PortletLabel';
import PortletToolbar from 'components/PortletToolbar';
import PortletContent from 'components/PortletContent';
import PortletFooter from 'components/PortletFooter';

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
        <PortletHeader noDivider>
          <PortletLabel title="Latest sales" />
          <PortletToolbar>
            <Button
              className={classes.dropdownButton}
              size="small"
              variant="text"
            >
              Last 7 days <ArrowDropDownIcon />
            </Button>
          </PortletToolbar>
        </PortletHeader>
        <PortletContent>
          <div className={classes.chartWrapper}>
            <Bar
              data={data}
              options={options}
            />
          </div>
        </PortletContent>
        <PortletFooter className={classes.portletFooter}>
          <Button
            color="primary"
            size="small"
            variant="text"
          >
            Overview <ArrowRightIcon />
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
