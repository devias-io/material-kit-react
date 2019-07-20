/* eslint-disable react/display-name */
import React from 'react';
import { NavLink } from 'react-router-dom';

const ForwardNavLink = React.forwardRef((props, ref) => (
  <NavLink {...props} innerRef={ref} />
));

export default ForwardNavLink;
