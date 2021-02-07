/* eslint-disable react/prop-types */
import Cookies from 'js-cookie';
import React, {
  createContext,
  useState,
} from 'react';

export const TokenContext = createContext({
  token: '',
});

export const TokenContextProvider = ({ children }) => {
  const [token] = useState(Cookies.get('access-token') || undefined);

  const Values = {
    token
  };

  return (
    <TokenContext.Provider value={Values}>{children}</TokenContext.Provider>
  );
};
