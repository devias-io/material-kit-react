import Head from "next/head";
<<<<<<< HEAD
=======
import { Layout as DashboardLayout } from "src/layouts/dashboard/layout";
>>>>>>> 54e40cd57a2ecc94238358a6656f7988e73300c2
import { OverviewLatestOrders } from "src/sections/overview/overview-latest-orders";
import { OverviewLatestProducts } from "src/sections/overview/overview-latest-products";
import { OverviewSales } from "src/sections/overview/overview-sales";
import getTopContributors from "./api/topContributors";
import { subDays, subHours } from 'date-fns';
import { Box, Badge, Container, IconButton, SvgIcon, Tooltip, Unstable_Grid2 as Grid} from '@mui/material';
<<<<<<< HEAD
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
=======
>>>>>>> 54e40cd57a2ecc94238358a6656f7988e73300c2
import BellIcon from '@heroicons/react/24/solid/BellIcon';

const now = new Date();

export const getServerSideProps = async () => {
  const authors = await getTopContributors();
  return {
    props: {
      authors
    },
  };
};

const Page = (props) => (
  <>
    <Head>
      <title>
        Overview | Devias Kit
      </title>
    </Head>
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        py: 8,
      }}
    >
    <Box
      sx={{ position: "fixed", top: 20, right: 20, zIndex: 1000}}
    >
      <Tooltip title="Urgent Questions">
        <IconButton 
        onClick={() => { alert('clicked') }}>
          <Badge
            badgeContent={2}
            color="primary"
            sx={{ "& .MuiBadge-badge": {height: 30, minWidth: 30, borderRadius: 10, fontSize: 20}}}
          >
            <SvgIcon sx={{ fontSize: 50 }}>
              <BellIcon/>
            </SvgIcon>
          </Badge>
        </IconButton>
      </Tooltip>
    </Box>
      <Container maxWidth="xl">
        <Grid
          container
          spacing={3}
        >
          <Grid
            xs={12}
            md={12}
            lg={8}
          >
            <OverviewLatestOrders
              orders={[
                {
                  id: "f69f88012978187a6c12897f",
                  category: "Homework 1",
                  title: "Title",
                  body: "abcabacacacacac abcabacacacacac abcabacacacacac abcabacacacacac",
                },
                {
                  id: "9eaa1c7dd4433f413c308ce2",
                  category: "Homework 2",
                  title: "Title",
                  body: "abcabacacacacac abcabacacacacac abcabacacacacac abcabacacacacac",
                },
                {
                  id: "01a5230c811bd04996ce7c13",
                  category: "Homework 3",
                  title: "Title",
                  body: "abcabacacacacac abcabacacacacac abcabacacacacac abcabacacacacac",
                },
                {
                  id: "1f4e1bd0a87cea23cdb83d18",
                  category: "Homework 4",
                  title: "Title",
                  body: "abcabacacacacac abcabacacacacac abcabacacacacac abcabacacacacac",
                },
                {
                  id: "9f974f239d29ede969367103",
                  category: "Homework 5",
                  title: "Title",
                  body: "abcabacacacacac abcabacacacacac abcabacacacacac abcabacacacacac",
                },
                {
                  id: "ffc83c1560ec2f66a1c05596",
                  category: "Homework 6",
                  title: "Title",
                  body: "abcabacacacacac abcabacacacacac abcabacacacacac abcabacacacacac",
                },
              ]}
              sx={{ height: "100%" }}
            />
          </Grid>
          <Grid
            xs={12}
            md={12}
            lg={8}
          >
            <OverviewLatestOrders
              orders={[
                {
                  id: "f69f88012978187a6c12897f",
                  category: "Homework 1",
                  title: "Title",
                  body: "abcabacacacacac abcabacacacacac abcabacacacacac abcabacacacacac",
                },
                {
                  id: "9eaa1c7dd4433f413c308ce2",
                  category: "Homework 2",
                  title: "Title",
                  body: "abcabacacacacac abcabacacacacac abcabacacacacac abcabacacacacac",
                },
                {
                  id: "01a5230c811bd04996ce7c13",
                  category: "Homework 3",
                  title: "Title",
                  body: "abcabacacacacac abcabacacacacac abcabacacacacac abcabacacacacac",
                },
                {
                  id: "1f4e1bd0a87cea23cdb83d18",
                  category: "Homework 4",
                  title: "Title",
                  body: "abcabacacacacac abcabacacacacac abcabacacacacac abcabacacacacac",
                },
                {
                  id: "9f974f239d29ede969367103",
                  category: "Homework 5",
                  title: "Title",
                  body: "abcabacacacacac abcabacacacacac abcabacacacacac abcabacacacacac",
                },
                {
                  id: "ffc83c1560ec2f66a1c05596",
                  category: "Homework 6",
                  title: "Title",
                  body: "abcabacacacacac abcabacacacacac abcabacacacacac abcabacacacacac",
                },
              ]}
              sx={{ height: "100%" }}
            />
          </Grid>
          <Grid
            xs={12}
            md={6}
            lg={4}
          >
            <OverviewLatestProducts
              products={[props.authors[0], props.authors[1], props.authors[2], props.authors[3], props.authors[4]]}
              sx={{ height: "100%" }}
            />
          </Grid>
          <Grid
            xs={12}
            lg={8}
          >
            <OverviewSales
              chartSeries={[
                {
                  name: 'Data',
                  data: [18, 16, 5, 8, 3, 14]
                }
              ]}
              sx={{ height: "100%" }}
            />
          </Grid>
        </Grid>
      </Container>
    </Box>
  </>
);

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
