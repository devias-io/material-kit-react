const Page = () => (
    <>
        <Head>
            <title>
                Dashboard | Platform-20
            </title>
        </Head>
        <Box
            component="main"
            sx={{
                flexGrow: 1,
                py: 8
            }}
        ></Box>
    </>
);

        


Page.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default Page;