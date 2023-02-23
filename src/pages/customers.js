import { Box, Container } from "@mui/material";
import Head from "next/head";
import { useState } from "react";
import { CustomerListResults } from "../components/customer/customer-list-results";
import { CustomerListToolbar } from "../components/customer/customer-list-toolbar";
import { DashboardLayout } from "../components/dashboard-layout";
import useDebounce from "../hooks/useDebounce";
import useGetAllCustomers from "../services/customers/useGetAllCustomers";

const Page = () => {
  const [query, setQuery] = useState({
    page: 0,
    perPage: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
    keyword: undefined,
  });
  const keywordDebounce = useDebounce(query.keyword, 500);
  const { data: { data: customers = [], total = 0 } = {}, isLoading } = useGetAllCustomers({
    offset: query.page * query.perPage,
    limit: query.perPage,
    keyword: keywordDebounce,
    ...query,
  });

  const onQueryChange = (newQuery) => {
    setQuery((query) => ({
      ...query,
      ...newQuery,
    }));
  };

  const onSearch = (keyword) => {
    setQuery((query) => ({
      ...query,
      keyword,
    }));
  };

  return (
    <>
      <Head>
        <title>Customers | Material Kit</title>
      </Head>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 8,
        }}
      >
        <Container maxWidth={false}>
          <CustomerListToolbar keyword={query.keyword} onSearch={onSearch} />
          <Box sx={{ mt: 3 }}>
            <CustomerListResults
              customers={customers}
              query={query}
              total={total}
              onQueryChange={onQueryChange}
            />
          </Box>
        </Container>
      </Box>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
