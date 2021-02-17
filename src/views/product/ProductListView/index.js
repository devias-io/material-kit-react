/* eslint-disable max-len */
/* eslint-disable no-unused-expressions */
import React, { useEffect, useState, useContext } from 'react';
import {
  Box,
  Container,
  Grid,
  makeStyles
} from '@material-ui/core';
import { Pagination } from '@material-ui/lab';
import Page from 'src/components/Page';
import Toolbar from './Toolbar';
import ProductCard from './ProductCard';
import { getProducts } from '../../../api/products';
import { TokenContext } from '../../../lib/context/contextToken';

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.dark,
    minHeight: '100%',
    paddingBottom: theme.spacing(3),
    paddingTop: theme.spacing(3)
  },
  productCard: {
    height: '100%'
  }
}));

const ProductList = () => {
  const { token } = useContext(TokenContext);
  const classes = useStyles();
  const [DataProducts, setProducts] = useState([]);
  const [actualizarProducts, setActualizarProducts] = useState(false);
  const [SearchProducts, setSearchProducts] = useState('');

  useEffect(() => {
    try {
      const fetchUsers = async () => {
        const { products } = await (await getProducts(token)).data;
        setProducts(products);
      };

      fetchUsers();

      actualizarProducts && setActualizarProducts(false);
    } catch (error) {
      console.log(error.message);
    }
  }, [actualizarProducts]);

  return (
    <Page
      className={classes.root}
      title="Products"
    >
      <Container maxWidth={false}>
        <Toolbar setActualizarProducts={setActualizarProducts} setSearchProducts={setSearchProducts} />
        <Box mt={3}>
          <Grid
            container
            spacing={3}
          >
            {DataProducts.filter((item) => {
              return item.name.toLowerCase().includes(SearchProducts.toLowerCase())
                || item.stock.toString().toLowerCase().includes(SearchProducts.toLowerCase());
            }).map((product) => (
              <Grid
                item
                key={product.id}
                lg={4}
                md={6}
                xs={12}
              >
                <ProductCard
                  className={classes.productCard}
                  product={product}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
        <Box
          mt={3}
          display="flex"
          justifyContent="center"
        >
          <Pagination
            color="primary"
            count={3}
            size="small"
          />
        </Box>
      </Container>
    </Page>
  );
};

export default ProductList;
