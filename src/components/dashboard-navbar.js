import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { AppBar, Avatar, Badge, Box, IconButton, Toolbar, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import { Bell as BellIcon } from '../icons/bell';
import { UserCircle as UserCircleIcon } from '../icons/user-circle';
import { Users as UsersIcon } from '../icons/users';
import { useEffect } from 'react';
import axios from 'axios';
import React, { useState } from 'react';
const DashboardNavbarRoot = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[3]
}));

export const DashboardNavbar = (props) => {
  const { onSidebarOpen, ...other } = props;

  
  const [fullName, setFullname] = useState("");
  const [email,setEmail] = useState("")

  // useEffect (() => {

  //   console.log("Im here")

  //   const token = localStorage.getItem('token');
  //   console.log(token);

  //   axios.get(
  //     `https://614c-103-224-35-112.ngrok.io/users/me/`, {headers: {
  //       'Authorization': `bearer ${token}` 
  //     }})
  //       .then(res => {
  //       console.log(res);
  //       console.log(res.data);  
  //       setFullname(res.data.full_name);
  //       setEmail(res.data.email)
  //       console.log("#######", fullName);
  //   })

  // })
  return (
    <>
      <DashboardNavbarRoot
        sx={{
          left: {
            lg: 280
          },
          width: {
            lg: 'calc(100% - 280px)'
          }
        }}
        {...other}>
        <Toolbar
          disableGutters
          sx={{
            minHeight: 64,
            left: 0,
            px: 2
          }}
        >
          <IconButton
            onClick={onSidebarOpen}
            sx={{
              display: {
                xs: 'inline-flex',
                lg: 'none'
              }
            }}
          >
            <MenuIcon fontSize="small" />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />

          <Avatar
            sx={{
              bgcolor : "error.main",
              height: 40,
              width: 40,
              ml: 1
            }}
          >
           {fullName.charAt(0).toUpperCase()} 
          </Avatar>
        </Toolbar>
      </DashboardNavbarRoot>
    </>
  );
};

DashboardNavbar.propTypes = {
  onSidebarOpen: PropTypes.func
};
