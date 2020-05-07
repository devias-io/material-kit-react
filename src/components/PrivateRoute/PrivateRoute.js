import React from 'react';
import { Route } from 'react-router-dom';
import PropTypes from 'prop-types';
import {Redirect } from 'react-router-dom';
import { isAuthenticated } from "../../services/auth";   

const PrivateRoute = props => {
  const { layout: Layout, component: Component, ...rest } = props;

  return (
  <Route
    {...rest}
    render={props =>
      isAuthenticated() ? (
        <Component {...props} />,
        <Layout>
        <Component {...props} />
      </Layout>
      ) : (
        <Redirect to={{ pathname: "/", state: { from: props.location } }} />
      )
    }
  />
  );
};

PrivateRoute.propTypes = {
  component: PropTypes.any.isRequired,
  layout: PropTypes.any.isRequired,
  path: PropTypes.string
};

export default PrivateRoute;
