import React, { Component } from 'react';

// Externals
import { Doughnut } from 'react-chartjs-2';
import classNames from 'classnames';
import PropTypes from 'prop-types';

// Material helpers
import { withStyles } from '@material-ui/core/styles';

// Material components
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';

import DevicesIcon from '@material-ui/icons/Devices';
import LaptopMacIcon from '@material-ui/icons/LaptopMac';
import PhoneIphoneIcon from '@material-ui/icons/PhoneIphone';
import RefreshIcon from '@material-ui/icons/Refresh';
import TabletMacIcon from '@material-ui/icons/TabletMac';

// Shared components
import Portlet from 'components/Portlet';
import PortletHeader from 'components/PortletHeader';
import PortletLabel from 'components/PortletLabel';
import PortletToolbar from 'components/PortletToolbar';
import PortletContent from 'components/PortletContent';

// Palette
import palette from 'theme/palette';

// Chart configuration
import { data, options } from './chart';

// Component styles
import styles from './styles';

class DevicesChart extends Component {
  render() {
    const { classes, className, ...rest } = this.props;

    const rootClassName = classNames(classes.root, className);

    return (
      <Portlet
        {...rest}
        className={rootClassName}
      >
        <PortletHeader noDivider>
          <PortletLabel
            icon={<DevicesIcon />}
            title="Users by device"
          />
          <PortletToolbar>
            <IconButton
              className={classes.refreshButton}
              variant="text"
            >
              <RefreshIcon />
            </IconButton>
          </PortletToolbar>
        </PortletHeader>
        <PortletContent>
          <div className={classes.chartWrapper}>
            <Doughnut
              data={data}
              options={options}
            />
          </div>
          <div className={classes.stats}>
            <div className={classes.device}>
              <LaptopMacIcon className={classes.deviceIcon} />
              <Typography variant="body1">Desktop</Typography>
              <Typography
                style={{ color: palette.primary.main }}
                variant="h2"
              >
                63%
              </Typography>
            </div>
            <div className={classes.device}>
              <TabletMacIcon className={classes.deviceIcon} />
              <Typography variant="body1">Tablet</Typography>
              <Typography
                style={{ color: palette.danger.main }}
                variant="h2"
              >
                15%
              </Typography>
            </div>
            <div className={classes.device}>
              <PhoneIphoneIcon className={classes.deviceIcon} />
              <Typography variant="body1">Mobile</Typography>
              <Typography
                style={{ color: palette.warning.main }}
                variant="h2"
              >
                23%
              </Typography>
            </div>
          </div>
        </PortletContent>
      </Portlet>
    );
  }
}

DevicesChart.propTypes = {
  className: PropTypes.string,
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(DevicesChart);
