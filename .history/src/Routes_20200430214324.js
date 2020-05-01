import React from 'react';
import { Switch, Redirect } from 'react-router-dom';

import { RouteWithLayout } from './components';
import { Main as MainLayout, Minimal as MinimalLayout } from './layouts';

import {
  Dashboard as DashboardView,
  SignIn as SignInView,
  TarefaList as TarefaListView,
  Clientes as ClientesView,
  ProdutoList as ProdutoListView,
  Conta as ContaView,
  FornecedorList as FornecedorListView,
  // Typography as TypographyView,
  // Icons as IconsView,
  // Settings as SettingsView,
  // SignUp as SignUpView,
  // NotFound as NotFoundView
} from './views';

const Routes = () => {
  return (
    <Switch>
      <Redirect
        exact
        from="/"
        to="/login"
      />
      <RouteWithLayout
        component={DashboardView}
        exact
        layout={MainLayout}
        path="/dashboard"
      />
      <RouteWithLayout
        component={TarefaListView}
        exact
        layout={MainLayout}
        path="/tarefas"
      />

      <RouteWithLayout
        component={ClientesView}
        exact
        layout={MainLayout}
        path="/clientes"
      />

      <RouteWithLayout
        component={ProdutoListView}
        exact
        layout={MainLayout}
        path="/produtos"
      />

      <RouteWithLayout
        component={FornecedorListView}
        exact
        layout={MainLayout}
        path="/fornecedores"
      />

      {/* <RouteWithLayout
        component={SignUpView}
        exact
        layout={MinimalLayout}
        path="/sign-up"
      /> */}
      <RouteWithLayout
        component={SignInView}
        exact
        layout={MinimalLayout}
        path="/login"
      />

      <RouteWithLayout
        component={ContaView}
        exact
        layout={MainLayout}
        path="/conta"
      />

      <Redirect to="/not-found" />
    </Switch>
  );
};

export default Routes;
