import { useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import PropTypes from "prop-types";
import { AuthContext, useAuthContext } from "../contexts/auth-context";
import { getCookies } from "../utils/cookies";
import { ACCESS_TOKEN_KEY } from "../configs/constants";
import useGetMe from "../services/auth/useGetMe";

export const AuthGuard = (props) => {
  const { children } = props;
  const router = useRouter();
  const { isAuthenticated } = useContext(AuthContext);
  const ignore = useRef(false);
  const [checked, setChecked] = useState(false);
  const [isUserLogged, setIsUserLogged] = useState(false);
  const {} = useGetMe(isUserLogged);

  // Only do authentication check on component mount.
  // This flow allows you to manually redirect the user after sign-out, otherwise this will be
  // triggered and will automatically redirect to sign-in page.

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    // Prevent from calling twice in development mode with React.StrictMode enabled
    if (ignore.current) {
      return;
    }

    ignore.current = true;

    const token = getCookies(ACCESS_TOKEN_KEY);
    if (token) {
      setIsUserLogged(true);
    }

    if (!isAuthenticated && !token) {
      console.error("Not authenticated, redirecting");
      router
        .replace({
          pathname: "/login",
          query: router.asPath !== "/" ? { next: router.asPath } : undefined,
        })
        .catch(console.error);
    } else {
      setChecked(true);
    }
  }, [router.isReady]);

  if (!checked) {
    return null;
  }

  // If got here, it means that the redirect did not occur, and that tells us that the user is
  // authenticated / authorized.

  return children;
};

AuthGuard.propTypes = {
  children: PropTypes.node,
};
