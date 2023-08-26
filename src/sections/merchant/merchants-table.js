import PropTypes from 'prop-types';
import { format } from 'date-fns';
import {
  Avatar,
  Box,
  Card,
  Checkbox,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography
} from '@mui/material';
import { Scrollbar } from 'src/components/scrollbar';
import { getInitials } from 'src/utils/get-initials';

export const MerchantsTable = (props) => {
  const {
    count = 0,
    items = [],
    onDeselectAll,
    onDeselectOne,
    onPageChange = () => {},
    onRowsPerPageChange,
    onSelectAll,
    onSelectOne,
    page = 0,
    rowsPerPage = 0,
    selected = []
  } = props;

  const selectedSome = (selected.length > 0) && (selected.length < items.length);
  const selectedAll = (items.length > 0) && (selected.length === items.length);

  return (
    <Card>
      <Scrollbar>
        <Box sx={{ minWidth: 800 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedAll}
                    indeterminate={selectedSome}
                    onChange={(event) => {
                      if (event.target.checked) {
                        onSelectAll?.();
                      } else {
                        onDeselectAll?.();
                      }
                    }}
                  />
                </TableCell>
                <TableCell>
                  Id
                </TableCell>
                <TableCell>
                  Name
                </TableCell>
                <TableCell>
                  Description
                </TableCell>
                <TableCell>
                  Phone
                </TableCell>
                <TableCell>
                  Address
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((merchant) => {
                const isSelected = selected.includes(merchant.id);
                // const createdAt = format(customer.createdAt, 'dd/MM/yyyy');

                return (
                  <TableRow
                    hover
                    key={merchant.id}
                    selected={isSelected}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isSelected}
                        onChange={(event) => {
                          if (event.target.checked) {
                            onSelectOne?.(merchant.id);
                          } else {
                            onDeselectOne?.(merchant.id);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {merchant.id}
                    </TableCell>
                    <TableCell>
                      {/*<Stack*/}
                      {/*  alignItems="center"*/}
                      {/*  direction="row"*/}
                      {/*  spacing={2}*/}
                      {/*>*/}
                      {/*  <Avatar src={customer.avatar}>*/}
                      {/*    {getInitials(customer.name)}*/}
                      {/*  </Avatar>*/}
                      {/*  <Typography variant="subtitle2">*/}
                      {/*    {customer.name}*/}
                      {/*  </Typography>*/}
                      {/*</Stack>*/}
                      {merchant.name}
                    </TableCell>
                    <TableCell>
                      {merchant.description}
                    </TableCell>
                    <TableCell>
                      {merchant.phone}
                    </TableCell>
                    <TableCell>
                      {merchant.addressFirstLine},
                      {merchant.addressSecondLine},
                      {merchant.city},
                      {merchant.state},
                      {merchant.pincode}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Scrollbar>
      <TablePagination
        component="div"
        count={count}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </Card>
  );
};

MerchantsTable.propTypes = {
  count: PropTypes.number,
  items: PropTypes.array,
  onDeselectAll: PropTypes.func,
  onDeselectOne: PropTypes.func,
  onPageChange: PropTypes.func,
  onRowsPerPageChange: PropTypes.func,
  onSelectAll: PropTypes.func,
  onSelectOne: PropTypes.func,
  page: PropTypes.number,
  rowsPerPage: PropTypes.number,
  selected: PropTypes.array
};
