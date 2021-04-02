/* eslint-disable max-len */
/* eslint-disable react/prop-types */
import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import moment from 'moment';
import {
  Avatar,
  Box,
  Card,
  Button,
  CardContent,
  Divider,
  Grid,
  Typography,
  makeStyles
} from '@material-ui/core';
import AccessTimeIcon from '@material-ui/icons/AccessTime';
import ModalElement from 'src/components/Modal';
import { BASE_API } from '../../../api';
import UpdateFormProduct from '../../../components/updateProduct';
import { deleteProduct } from '../../../api/products';
import { TokenContext } from '../../../lib/context/contextToken';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column'
  },
  statsItem: {
    alignItems: 'center',
    display: 'flex'
  },
  statsIcon: {
    marginRight: theme.spacing(1)
  }
}));

const ProductCard = ({
  className, product, setActualizarProducts, ...rest
}) => {
  const { token } = useContext(TokenContext);
  const [loading, setLoading] = useState(false);
  const [Modal, setModal] = useState(false);
  const classes = useStyles();

  const RemoveProduct = async (idProducts) => {
    setLoading(true);

    try {
      await deleteProduct(token, idProducts);
      setLoading(false);
      setActualizarProducts(true);
    } catch (error) {
      setLoading(false);
      console.log(error.message);
    }
  };

  return (
    <>
      <Card
        className={clsx(classes.root, className)}
        {...rest}
      >
        <CardContent>
          <Box
            display="flex"
            justifyContent="center"
            mb={3}
          >
            <Avatar
              alt={product.name}
              src={`${BASE_API}/static/products/${product.source}`}
              variant="square"
              style={{ width: 100, height: 100 }}
            />
          </Box>
          <Typography
            align="center"
            color="textPrimary"
            gutterBottom
            variant="h4"
          >
            {product.name}
          </Typography>
          <Typography
            align="center"
            color="textPrimary"
            variant="body1"
          >
            {product.description}
          </Typography>
        </CardContent>
        <Box flexGrow={1} />
        <Divider />
        <Box p={2}>
          <Grid
            container
            justify="space-between"
            spacing={2}
          >
            <Grid
              className={classes.statsItem}
              item
            >
              <AccessTimeIcon
                className={classes.statsIcon}
                color="action"
              />
              <Typography
                color="textSecondary"
                display="inline"
                variant="body2"
              >
                {moment(product.update_at).format('LL')}
              </Typography>
            </Grid>
            <Grid
              className={classes.statsItem}
              item
            >
              <Typography
                color="textSecondary"
                display="inline"
                variant="body2"
              >
                {product.stock}
                {' '}
                Stock - para
                {' '}
                <strong>{product.tipo}</strong>
              </Typography>
            </Grid>
          </Grid>
          <Grid
            container
            justify="space-between"
            spacing={2}
          >
            <Grid
              className={classes.statsItem}
              item
            >
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  setModal(true);
                }}
              >
                Editar
              </Button>
            </Grid>
            <Grid
              className={classes.statsItem}
              item
            >
              <Button variant="contained" onClick={() => RemoveProduct(product.idProducts)}>{loading ? 'Cargando...' : 'Eliminar'}</Button>
            </Grid>
          </Grid>
        </Box>
      </Card>

      <ModalElement visible={Modal} setVisible={setModal}>
        <UpdateFormProduct product={product} setActualizarProducts={setActualizarProducts} />
      </ModalElement>
    </>
  );
};

ProductCard.propTypes = {
  className: PropTypes.string,
  product: PropTypes.object.isRequired
};

export default ProductCard;
