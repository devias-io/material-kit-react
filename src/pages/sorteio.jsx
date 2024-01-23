import PlusIcon from "@heroicons/react/24/solid/PlusIcon";
import { Alert, Box, Button, Container, Snackbar, Stack, SvgIcon, Typography } from "@mui/material";
import Head from "next/head";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelection } from "src/hooks/use-selection";
import { Layout as DashboardLayout } from "src/layouts/dashboard/layout";
import { GetAllClientsUseCase } from "src/provider/useCases/clients/get-all-client.usecase";
import { GetAllDrawsUsecase } from "src/provider/useCases/draws/get-all-draws.usecase";
import { CustomersSearch } from "src/sections/customer/customers-search";
import { CustomersTable } from "src/sections/customer/customers-table";
import { EditCustomerDialog, EditDrawDialog } from "src/sections/customer/edit-customer-dialog";
import { GiveTicketDialog } from "src/sections/customer/give-ticket-customer-dialog";
import { DrawsTable } from "src/sections/draws/draws-table";
import { EditDrawsDialog } from "src/sections/draws/edit-customer-dialog";
import { applyPagination } from "src/utils/apply-pagination";

const Page = () => {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [snakBarMsg, setSnakBarMsg] = useState("");
  const [snakBarOpen, setSnakBarOpen] = useState(false);
  const [snackBarStatus, setSnackBarStatus] = useState("success");
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState("close");
  const [dialogData, setDialogData] = useState({});

  const useCustomerIds = (customers) => {
    return useMemo(() => {
      return customers?.map((customer) => customer.id);
    }, [customers]);
  };

  useEffect(() => {
    GetAllDrawsUsecase().then((response) => {
      setData(response);
    });
  }, [search, page, rowsPerPage, dialog]);

  const handleChangeSearch = (e) => {
    setSearch(e.target.value);
  };

  const handlePageChange = useCallback((event, value) => {
    setPage(value);
  }, []);

  const handleRowsPerPageChange = useCallback((event) => {
    setRowsPerPage(event.target.value);
  }, []);

  const handleEditButton = (id) => {
    setDialogData(id);
    setDialog("edit");
  };

  return (
    <>
      <Head>
        <title>Sorteios | Realizza Backoffice</title>
      </Head>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 8,
        }}
      >
        <Container maxWidth="xl">
          <Stack spacing={3}>
            <Stack direction="row" justifyContent="space-between" spacing={4}>
              <Stack spacing={1}>
                <Typography variant="h4">Sorteios</Typography>
              </Stack>
            </Stack>
            <CustomersSearch search={search} onChange={handleChangeSearch} />
            <DrawsTable
              count={data}
              items={data}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              handleEdit={handleEditButton}
            />
          </Stack>
        </Container>
      </Box>
      <EditDrawsDialog
        dialog={dialog}
        setDialog={setDialog}
        data={dialogData}
        setSnakBarMsg={setSnakBarMsg}
        setSnakBarOpen={setSnakBarOpen}
        setSnackBarStatus={setSnackBarStatus}
      />
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        autoHideDuration={3000}
        open={snakBarOpen}
        onClose={() => setSnakBarOpen(false)}
      >
        <Alert
          onClose={() => setSnakBarOpen(false)}
          severity={snackBarStatus}
          sx={{ width: "100%" }}
        >
          {snakBarMsg}
        </Alert>
      </Snackbar>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
