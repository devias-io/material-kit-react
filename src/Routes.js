import React from 'react';

import {BrowserRouter, Route ,Switch, Redirect } from 'react-router-dom';  ///////////////////////////////////

import { RouteWithLayout } from './components';
import { PrivateRoute } from './components';

import { Main as MainLayout, Minimal as MinimalLayout } from './layouts';

import {
  Dashboard as DashboardView,
  SignIn as SignInView,
  TarefaList as TarefaListView,
  Clientes as ClientesView,
  ProdutoList as ProdutoListView,
  FornecedorList as FornecedorListView,
  // Typography as TypographyView,
  // Icons as IconsView,
  AddFornecedores as AddFornecedoresView,
  // Settings as SettingsView,
  SignUp as SignUpView,
  // NotFound as NotFoundView
} from './views';


const Routes = () => {
  return (
  <BrowserRouter>
    <Switch>
      <Redirect
        exact
        from="/"
        to="/login"
      />

      {/* <RouteWithLayout
        component={DashboardView}
        layout={MainLayout}
        path="/dashboard"
      /> */}

      <PrivateRoute
        path="/dashboard"
        exact
        component={DashboardView}
        layout={MainLayout}
        
      />

      <PrivateRoute
        component={TarefaListView}
        exact
        layout={MainLayout}
        path="/tarefas"
      />

      <PrivateRoute
        component={ClientesView}
        exact
        layout={MainLayout}
        path="/clientes"
      />

      <PrivateRoute
        component={ProdutoListView}
        exact
        layout={MainLayout}
        path="/produtos"
      />

      <PrivateRoute
        component={FornecedorListView}
        exact
        layout={MainLayout}
        path="/fornecedores"
      />

      <RouteWithLayout   // rota que não precisa passa por autenticação para ser acessada
        component={SignUpView}
        exact
        layout={MinimalLayout}
        path="/sign-up"
      />
      <RouteWithLayout    // rota que não precisa passa por autenticação para ser acessada
        component={SignInView}
        exact
        layout={MinimalLayout}
        path="/login"
      />

      <PrivateRoute
        component={AddFornecedoresView}
        exact
        layout={MainLayout}
        path="/AddFornecedor"
      />



      <Redirect to="/not-found" />
     </Switch>
  </BrowserRouter>
  );
};

export default Routes;
