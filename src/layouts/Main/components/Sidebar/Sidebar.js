import React from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/styles';
import { Divider, Drawer } from '@material-ui/core';
import DashboardIcon from '@material-ui/icons/Dashboard';
import LockOpenIcon from '@material-ui/icons/LockOpen';
import LaptopChromebookIcon from '@material-ui/icons/LaptopChromebook';
import PeopleIcon from '@material-ui/icons/People';
import ShoppingBasketIcon from '@material-ui/icons/ShoppingBasket';
import FormatListBulletedIcon from '@material-ui/icons/FormatListBulleted';
// import BusinessCenterIcon from '@material-ui/icons/BusinessCenter';
import LocalShippingIcon from '@material-ui/icons/LocalShipping';

import { Profile, SidebarNav, } from './components';

const useStyles = makeStyles(theme => ({
  drawer: {
    width: 240,
    [theme.breakpoints.up('lg')]: {
      marginTop: 64,
      height: 'calc(100% - 64px)'
    }
  },
  root: {
    backgroundColor: theme.palette.white,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: theme.spacing(2)
  },
  divider: {
    margin: theme.spacing(2, 0)
  },
  nav: {
    marginBottom: theme.spacing(2)
  }
}));

const Sidebar = props => {
  const { open, variant, onClose, className, ...rest } = props;

  const classes = useStyles();

  const pages = [
    {
      title: 'Painel Administrativo',
      href: '/dashboard',
      icon: <DashboardIcon />
    },

    {
      title: 'GESTÃO',
      icon: <LaptopChromebookIcon />,
      items: [

        {
          title: 'Clientes',
          href: '/clientes',
          icon: <PeopleIcon />,
        }
      ]
    },
    {
      title: 'Clientes',
      href: '/clientes',
      icon: <PeopleIcon />
    },
    {
      title: 'Produtos',
      href: '/produtos',
      icon: <ShoppingBasketIcon />
    },
    {
      title: 'Pedidos',
      href: '/tarefas',
      icon: <FormatListBulletedIcon />
    },
    {
      title: 'Fornecedores',
      href: '/fornecedores',
      icon: <LocalShippingIcon />
    },
    {
      title: 'Login',
      href: '/login',
      icon: <LockOpenIcon />
    },



    // {
    //   title: 'Products',
    //   href: '/products',
    //   icon: <ShoppingBasketIcon />
    // },
    // {
    //   title: 'Authentication',
    //   href: '/sign-in',
    //   icon: <LockOpenIcon />
    // },
    // {
    //   title: 'Typography',
    //   href: '/typography',
    //   icon: <TextFieldsIcon />
    // },
    // {
    //   title: 'Icons',
    //   href: '/icons',
    //   icon: <ImageIcon />
    // },
    // {
    //   title: 'Account',
    //   href: '/account',
    //   icon: <AccountBoxIcon />
    // },
    // {
    //   title: 'Settings',
    //   href: '/settings',
    //   icon: <SettingsIcon />
    // }
  ];

  return (
    <Drawer
      anchor="left"
      classes={{ paper: classes.drawer }}
      onClose={onClose}
      open={open}
      variant={variant}
    >
      <div
        {...rest}
        className={clsx(classes.root, className)}
      >
        <Profile />
        <Divider className={classes.divider} />
        <SidebarNav
          className={classes.nav}
          pages={pages}
        />

      </div>
    </Drawer>
  );
};

Sidebar.propTypes = {
  className: PropTypes.string,
  onClose: PropTypes.func,
  open: PropTypes.bool.isRequired,
  variant: PropTypes.string.isRequired
};

export default Sidebar;
