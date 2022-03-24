import Head from 'next/head';
import { Box, Container } from '@mui/material';
import { BoardListResults } from '../components/board/board-list-results';
import { BoardListToolbar } from '../components/board/board-list-toolbar';
import { DashboardLayout } from '../components/dashboard-layout';
import { board } from '../__mocks__/boards';

const Board = () => (
  <>
    <Head>
      <title>
        Board | chester lee
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
          <BoardListResults board={board} />
        </Box>
      </Container>
    </Box>
  </>
);
Board.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default Board;
