import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useContext } from "react";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "../../configs/constants";
import { AuthContext } from "../../contexts/auth-context";
import { setCookie } from "../../utils/cookies";
import { notify } from "../../utils/notification";
import request from "../../utils/request";

export const USE_LOGIN_KEY = "useLogin";

const useLogin = () => {
  const { setUser } = useContext(AuthContext);
  const router = useRouter();
  return useMutation(
    [USE_LOGIN_KEY],
    async (data) => {
      return request.post("/auth/login", data);
    },
    {
      onSuccess: (response) => {
        if (!response) return;

        const { data, message, tokens } = response;
        setUser(data);
        notify(message);
        const { access_token, refresh_token, exp } = tokens;
        setCookie(ACCESS_TOKEN_KEY, access_token, { expires: new Date(Date.now() + exp * 1000) });
        setCookie(REFRESH_TOKEN_KEY, refresh_token);
        const redirect = router.query.next || "/";
        router.push(redirect).catch(console.error);
      },
    }
  );
};

export default useLogin;
