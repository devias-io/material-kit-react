import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { subDays, subHours } from 'date-fns';
import ArrowDownOnSquareIcon from '@heroicons/react/24/solid/ArrowDownOnSquareIcon';
import ArrowUpOnSquareIcon from '@heroicons/react/24/solid/ArrowUpOnSquareIcon';
import PlusIcon from '@heroicons/react/24/solid/PlusIcon';
import { Box, Button, Container, Stack, SvgIcon, Typography } from '@mui/material';
import { useSelection } from 'src/hooks/use-selection';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { MerchantsTable } from 'src/sections/merchant/merchants-table';
import { CustomersSearch } from 'src/sections/customer/customers-search';
import { applyPagination } from 'src/utils/apply-pagination';

const now = new Date();

const data = [
  {
    "id": 1,
    "zoneId": 1,
    "name":"Bell Hotel",
    "description": "Bell Hotel, Madurai",
    "rating": 4.3,
    "addressFirstLine": "232 Nehru Street",
    "addressSecondLine": "",
    "city": "Madurai",
    "state": "Tamil Nadu",
    "phone": "9876534234",
    "pincode": "631243",
    "commissionFrom": "",
    "commissionRate": "",
    "additionalDetails": "",
    "listOfItems": []
  }
];

const useMerchants = (page, rowsPerPage) => {
  return useMemo(
    () => {
      return applyPagination(data, page, rowsPerPage);
    },
    [page, rowsPerPage]
  );
};

const useMerchantIds = (merchants) => {
  return useMemo(
    () => {
      return merchants.map((merchant) => merchant.id);
    },
    [merchants]
  );
};

const Page = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [merchantsData, setMerchantData] = useState(null);

  useEffect(() => {
    const getMerchantData = async () => {
      const response = await fetch('http://localhost:8080/api/v1/merchants', {
        method: "GET"});
      const data = await response.json();
      console.log(data)
      setMerchantData(data);
    };

    getMerchantData();
  }, []);

  const merchants = useMerchants(page, rowsPerPage);
  const merchantIds = useMerchantIds(merchants);
  const merchantSelection = useSelection(merchantIds);

  const handlePageChange = useCallback(
    (event, value) => {
      setPage(value);
    },
    []
  );

  const handleRowsPerPageChange = useCallback(
    (event) => {
      setRowsPerPage(event.target.value);
    },
    []
  );

  return (
    <>
      <Head>
        <title>
         Merchants
        </title>
      </Head>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 8
        }}
      >
        <Container maxWidth="xl">
          <Stack spacing={3}>
            <Stack
              direction="row"
              justifyContent="space-between"
              spacing={4}
            >
              <Stack spacing={1}>
                <Typography variant="h4">
                  Merchant
                </Typography>
                <Stack
                  alignItems="center"
                  direction="row"
                  spacing={1}
                >
                  <Button
                    color="inherit"
                    startIcon={(
                      <SvgIcon fontSize="small">
                        <ArrowUpOnSquareIcon />
                      </SvgIcon>
                    )}
                  >
                    Import
                  </Button>
                  <Button
                    color="inherit"
                    startIcon={(
                      <SvgIcon fontSize="small">
                        <ArrowDownOnSquareIcon />
                      </SvgIcon>
                    )}
                  >
                    Export
                  </Button>
                </Stack>
              </Stack>
              <div>
                <Button
                  startIcon={(
                    <SvgIcon fontSize="small">
                      <PlusIcon />
                    </SvgIcon>
                  )}
                  variant="contained"
                >
                  Add
                </Button>
              </div>
            </Stack>
            <CustomersSearch />
            <MerchantsTable
              count={merchantsData==null ? 0 :merchantsData.length}
              items={merchantsData == null ? [] : merchantsData}
              onDeselectAll={merchantSelection.handleDeselectAll}
              onDeselectOne={merchantSelection.handleDeselectOne}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              onSelectAll={merchantSelection.handleSelectAll}
              onSelectOne={merchantSelection.handleSelectOne}
              page={page}
              rowsPerPage={rowsPerPage}
              selected={merchantSelection.selected}
            />
          </Stack>
        </Container>
      </Box>
    </>
  );
};

Page.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default Page;
