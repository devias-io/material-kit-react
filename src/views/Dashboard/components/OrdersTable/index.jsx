import React, { Component } from 'react';

// Externals
import classNames from 'classnames';
import moment from 'moment';
import PerfectScrollbar from 'react-perfect-scrollbar';
import PropTypes from 'prop-types';

// Material helpers
import { withStyles } from '@material-ui/core/styles';

// Material components
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Tooltip from '@material-ui/core/Tooltip';
import TableSortLabel from '@material-ui/core/TableSortLabel';

// Shared services
import { getOrders } from 'services/order';

// Shared components
import Portlet from 'components/Portlet';
import PortletHeader from 'components/PortletHeader';
import PortletLabel from 'components/PortletLabel';
import PortletToolbar from 'components/PortletToolbar';
import PortletContent from 'components/PortletContent';
import Status from 'components/Status';

// Component styles
import styles from './styles';

const statusColors = {
  delivered: 'success',
  pending: 'info',
  refund: 'danger'
};

class OrdersTable extends Component {
  signal = false;

  state = {
    isLoading: false,
    limit: 10,
    orders: [],
    ordersTotal: 0
  };

  async getOrders(limit) {
    try {
      this.setState({ isLoading: true });

      const { orders, ordersTotal } = await getOrders(limit);

      if (this.signal) {
        this.setState({
          isLoading: false,
          orders,
          ordersTotal
        });
      }
    } catch (error) {
      if (this.signal) {
        this.setState({
          isLoading: false,
          error
        });
      }
    }
  }

  componentDidMount() {
    this.signal = true;

    const { limit } = this.state;

    this.getOrders(limit);
  }

  componentWillUnmount() {
    this.signal = false;
  }

  render() {
    const { classes, className } = this.props;
    const { isLoading, orders, ordersTotal } = this.state;

    const rootClassName = classNames(classes.root, className);
    const showOrders = !isLoading && orders.length > 0;

    return (
      <Portlet className={rootClassName}>
        <PortletHeader noDivider>
          <PortletLabel
            subtitle={`${ordersTotal} total`}
            title="Latest orders"
          />
          <PortletToolbar>
            <Button
              className={classes.newEntryButton}
              color="primary"
              size="small"
              variant="outlined"
            >
              New entry
            </Button>
          </PortletToolbar>
        </PortletHeader>
        <PerfectScrollbar>
          <PortletContent
            className={classes.portletContent}
            noPadding
          >
            {isLoading && (
              <div className={classes.progressWrapper}>
                <CircularProgress />
              </div>
            )}
            {showOrders && (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order ID</TableCell>
                    <TableCell align="left">Customer</TableCell>
                    <TableCell
                      align="left"
                      sortDirection="desc"
                    >
                      <Tooltip
                        enterDelay={300}
                        title="Sort"
                      >
                        <TableSortLabel
                          active
                          direction="desc"
                        >
                          Date
                        </TableSortLabel>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="left">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map(order => (
                    <TableRow
                      className={classes.tableRow}
                      hover
                      key={order.id}
                    >
                      <TableCell>{order.id}</TableCell>
                      <TableCell className={classes.customerCell}>
                        {order.customer.name}
                      </TableCell>
                      <TableCell>
                        {moment(order.createdAt).format('DD/MM/YYYY')}
                      </TableCell>
                      <TableCell>
                        <div className={classes.statusWrapper}>
                          <Status
                            className={classes.status}
                            color={statusColors[order.status]}
                            size="sm"
                          />
                          {order.status}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </PortletContent>
        </PerfectScrollbar>
      </Portlet>
    );
  }
}

OrdersTable.propTypes = {
  className: PropTypes.string,
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(OrdersTable);
