import Head from 'next/head';
import { Box, Container } from '@mui/material';
import { BoardsListResults } from '../components/board/board-list-results';
import { BoardListToolbar } from '../components/board/board-list-toolbar';
import { DashboardLayout } from '../components/dashboard-layout';
import { boards } from '../__mocks__/boards';

const Boards = () => (
  <>
    <Head>
      <title>
        Board | chester lee (Material Kit)
      </title>
    </Head>
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        py: 8
      }}
    >
      <Container maxWidth={false}>
        <BoardListToolbar />
        <Box sx={{ mt: 3 }}>
          <BoardListResults boards={boards} />
        </Box>
      </Container>
    </Box>
  </>
);
Boards.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default Boards;
