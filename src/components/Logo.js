import React from 'react';

const Logo = (props) => {
  return (
    <img
      alt="Logo"
      src="/static/logo.svg"
      {...props}
    />
  );
};

export default Logo;
