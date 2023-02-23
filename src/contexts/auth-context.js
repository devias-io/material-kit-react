import React, { useEffect, useState } from "react";

export const AuthContext = React.createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
