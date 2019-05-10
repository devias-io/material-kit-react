import React, { Component, Fragment } from 'react';
import { Link } from 'react-router-dom';

// Externals
import classNames from 'classnames';
import PropTypes from 'prop-types';

// Shared services
import { getProducts } from 'services/product';

// Material helpers
import { withStyles } from '@material-ui/core/styles';

// Material components
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import CircularProgress from '@material-ui/core/CircularProgress';
import MoreVertIcon from '@material-ui/icons/MoreVert';

// Shared components
import Portlet from 'components/Portlet';
import PortletHeader from 'components/PortletHeader';
import PortletLabel from 'components/PortletLabel';
import PortletContent from 'components/PortletContent';
import PortletFooter from 'components/PortletFooter';

// Component styles
import styles from './styles';

class ProductList extends Component {
  signal = true;

  state = {
    isLoading: false,
    limit: 4,
    products: [],
    productsTotal: 0,
    error: null
  };

  async getProducts() {
    try {
      this.setState({ isLoading: true });

      const { limit } = this.state;

      const { products, productsTotal } = await getProducts(limit);

      if (this.signal) {
        this.setState({
          isLoading: false,
          products,
          productsTotal
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

  componentWillMount() {
    this.signal = true;

    this.getProducts();
  }

  componentWillUnmount() {
    this.signal = false;
  }

  renderProducts() {
    const { classes } = this.props;
    const { isLoading, products } = this.state;

    if (isLoading) {
      return (
        <div className={classes.progressWrapper}>
          <CircularProgress />
        </div>
      );
    }

    if (products.length === 0) {
      return (
        <Typography variant="h6">There are no products available</Typography>
      );
    }

    return (
      <Fragment>
        {products.map((product, i) => (
          <div
            className={classes.product}
            key={i}
          >
            <div className={classes.productImageWrapper}>
              <img
                alt="Product Name"
                className={classes.productImage}
                src={product.imageUrl}
              />
            </div>
            <div className={classes.productDetails}>
              <Link to={`/products/${product.id}`}>
                <Typography
                  className={classes.productTitle}
                  variant="h5"
                >
                  {product.title}
                </Typography>
              </Link>
              <Typography
                className={classes.productTimestamp}
                variant="body2"
              >
                Updated 5hr ago
              </Typography>
            </div>
            <div>
              <IconButton>
                <MoreVertIcon />
              </IconButton>
            </div>
          </div>
        ))}
      </Fragment>
    );
  }

  render() {
    const { classes, className, ...rest } = this.props;
    const { productsTotal } = this.state;

    const rootClassName = classNames(classes.root, className);

    return (
      <Portlet
        {...rest}
        className={rootClassName}
      >
        <PortletHeader noDivider>
          <PortletLabel
            subtitle={`${productsTotal} in total`}
            title="Latest products"
          />
        </PortletHeader>
        <PortletContent className={classes.portletContent}>
          {this.renderProducts()}
        </PortletContent>
        <PortletFooter className={classes.portletFooter}>
          <Button
            color="primary"
            size="small"
            variant="text"
          >
            View all <ArrowRightIcon />
          </Button>
        </PortletFooter>
      </Portlet>
    );
  }
}

ProductList.propTypes = {
  className: PropTypes.string,
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(ProductList);
