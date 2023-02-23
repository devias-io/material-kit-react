import { useContext } from "react";
import { AuthContext } from "../../contexts/auth-context";
import { clearCookies } from "../../utils/cookies";

const useSignOut = () => {
  const { setUser } = useContext(AuthContext);
  const signOut = () => {
    clearCookies();
    setUser(null);
    window.location.href = "/login";
  };

  return {
    signOut,
  };
};

export default useSignOut;
