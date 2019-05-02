import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';

function authGuard(WrappedComponent) {
  return class HOC extends Component {
    render() {
      const { history } = this.props;

      const isAuthenticated = JSON.parse(
        localStorage.getItem('isAuthenticated')
      );

      if (!isAuthenticated) {
        history.push('/sign-in');
        return null;
      }

      return <WrappedComponent {...this.props} />;
    }
  };
}

export default WrappedComponent => withRouter(authGuard(WrappedComponent));
