import * as React from 'react';
import { Route } from 'react-router-dom';

interface Props {
  component: any;
  layout: any;
  path: string;
  exact: boolean;
}

const RouteWithLayout = (props: Props) => {
  const { layout: Layout, component: Component, ...rest } = props;

  return (
    <Route
      {...rest}
      render={matchProps => (
        <Layout>
          <Component {...matchProps} />
        </Layout>
      )}
    />
  );
};

export default RouteWithLayout;
