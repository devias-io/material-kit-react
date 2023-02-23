import { useQuery } from "@tanstack/react-query";
import request from "../../utils/request";

const USE_GET_ALL_CUSTOMERS_KEY = "USE_GET_ALL_CUSTOMERS";

const useGetAllCustomers = (query) => {
  return useQuery(
    [USE_GET_ALL_CUSTOMERS_KEY, query],
    async () => {
      return request.get("/users", {
        params: query,
      });
    },
    {
      refetchOnWindowFocus: false,
    }
  );
};

export default useGetAllCustomers;
