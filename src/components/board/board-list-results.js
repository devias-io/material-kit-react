import { useState } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import {
  Avatar,
  Box,
  Card,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography
} from '@mui/material';
import { getInitials } from '../../utils/get-initials';

export const BoardListResults = ({ boards, ...rest }) => {
  const [selectedBoardIds, setSelectedBoardIds] = useState([]);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(0);

  const handleSelectAll = (event) => {
    let newSelectedBoardIds;

    if (event.target.checked) {
      newSelectedBoardIds = boards.map((board) => board.id);
    } else {
      newSelectedBoardIds = [];
    }

    setSelectedBoardIds(newSelectedBoardIds);
  };

  const handleSelectOne = (event, id) => {
    const selectedIndex = selectedBoardIds.indexOf(id);
    let newSelectedBoardIds = [];

    if (selectedIndex === -1) {
      newSelectedBoardIds = newSelectedBoardIds.concat(selectedBoardIds, id);
    } else if (selectedIndex === 0) {
      newSelectedBoardIds = newSelectedBoardIds.concat(selectedBoardIds.slice(1));
    } else if (selectedIndex === selectedBoardIds.length - 1) {
      newSelectedBoardIds = newSelectedBoardIds.concat(selectedBoardIds.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelectedBoardIds = newSelectedBoardIds.concat(
        selectedBoardIds.slice(0, selectedIndex),
        selectedBoardIds.slice(selectedIndex + 1)
      );
    }

    setSelectedBoardIds(newSelectedBoardIds);
  };

  const handleLimitChange = (event) => {
    setLimit(event.target.value);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  return (
    <Card {...rest}>
      <PerfectScrollbar>
        <Box sx={{ minWidth: 1050 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedBoardIds.length === boards.length}
                    color="primary"
                    indeterminate={
                      selectedBoardIds.length > 0
                      && selectedBoardIds.length < boards.length
                    }
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>
                  작성자
                </TableCell>
                <TableCell>
                  제목
                </TableCell>
                <TableCell>
                  Location
                </TableCell>
                <TableCell>
                  Phone
                </TableCell>
                <TableCell>
                  작성일
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {boards.slice(0, limit).map((board) => (
                <TableRow
                  hover
                  key={board.id}
                  selected={selectedBoardIds.indexOf(board.id) !== -1}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedBoardIds.indexOf(board.id) !== -1}
                      onChange={(event) => handleSelectOne(event, board.id)}
                      value="true"
                    />
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        alignItems: 'center',
                        display: 'flex'
                      }}
                    >
                      <Avatar
                        src={board.avatarUrl}
                        sx={{ mr: 2 }}
                      >
                        {getInitials(board.name)}
                      </Avatar>
                      <Typography
                        color="textPrimary"
                        variant="body1"
                      >
                        {board.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {board.email}
                  </TableCell>
                  <TableCell>
                    {`${board.address.city}, ${board.address.state}, ${board.address.country}`}
                  </TableCell>
                  <TableCell>
                    {board.phone}
                  </TableCell>
                  <TableCell>
                    {format(board.createdAt, 'dd/MM/yyyy')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </PerfectScrollbar>
      <TablePagination
        component="div"
        count={boards.length}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleLimitChange}
        page={page}
        rowsPerPage={limit}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </Card>
  );
};

BoardListResults.propTypes = {
  boards: PropTypes.array.isRequired
};
