import React from 'react';

const Logo = (props) => {
  return (
    <img
      alt="Logo"
      src="/static/logo.jpeg"
      {...props}
    />
  );
};

export default Logo;
