import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";
import { AuthContext } from "../../contexts/auth-context";
import request from "../../utils/request";

const USE_GET_ME_KEY = "useGetMe";

const useGetMe = (isReadyToFetch = false) => {
  const { setUser } = useContext(AuthContext);
  return useQuery(
    [USE_GET_ME_KEY],
    async () => {
      return request.get("/users/me");
    },
    {
      enabled: isReadyToFetch,
      onSuccess: (data) => {
        setUser(data.data);
      },
      refetchOnWindowFocus: false,
    }
  );
};

export default useGetMe;
