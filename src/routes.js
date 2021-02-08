import React from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from 'src/layouts/DashboardLayout';
import MainLayout from 'src/layouts/MainLayout';
import AccountView from 'src/views/account/AccountView';
import CustomerListView from 'src/views/customer/CustomerListView';
import DashboardView from 'src/views/reports/DashboardView';
import LoginView from 'src/views/auth/LoginView';
import NotFoundView from 'src/views/errors/NotFoundView';
import ProductListView from 'src/views/product/ProductListView';
import PacientListView from 'src/views/pacient';
import RegisterView from 'src/views/auth/RegisterView';
import SettingsView from 'src/views/settings/SettingsView';
import PacientView from 'src/views/pacient/ID';
import Cookies from 'js-cookie';

const token = Cookies.get('access-token');

const PathSesion = (Componente) => {
  if (token) {
    return <Componente />;
  }
  return <Navigate to="/login" />;
};

const routes = [
  {
    path: 'app',
    element: <DashboardLayout />,
    children: [
      { path: 'account', element: PathSesion(AccountView) },
      { path: 'customers', element: PathSesion(CustomerListView) },
      { path: 'dashboard', element: PathSesion(DashboardView) },
      { path: 'products', element: PathSesion(ProductListView) },
      { path: 'settings', element: PathSesion(SettingsView) },
      { path: 'pacient', element: PathSesion(PacientListView) },
      { path: 'pacient/:idPacient', element: PathSesion(PacientView) },
      { path: '*', element: <Navigate to="/404" /> }
    ]
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { path: 'login', element: <LoginView /> },
      { path: 'register', element: <RegisterView /> },
      { path: '404', element: <NotFoundView /> },
      { path: '/', element: <Navigate to="/app/dashboard" /> },
      { path: '*', element: <Navigate to="/404" /> }
    ]
  }
];

export default routes;
