import { PencilSquareIcon } from "@heroicons/react/24/outline";
import {
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
} from "@mui/material";
import PropTypes from "prop-types";
import { Scrollbar } from "src/components/scrollbar";
import { currencyBrlFormat } from "src/utils/currencyBRLFormat";

export const DrawsTable = (props) => {
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
    selected = [],
    handleEdit = () => {},
    handleGiveTicket = () => {},
  } = props;

  const selectedSome = selected.length > 0 && selected.length < items.length;
  const selectedAll = items.length > 0 && selected.length === items.length;

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
                <TableCell>Nome</TableCell>
                <TableCell>Preço</TableCell>
                <TableCell>Preço Secundário</TableCell>
                <TableCell>Preço Terciário</TableCell>
                <TableCell>{/* Signed Up */}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((draws) => {
                const isSelected = selected.includes(draws.id);

                return (
                  <TableRow hover key={draws.id} selected={isSelected}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isSelected}
                        onChange={(event) => {
                          if (event.target.checked) {
                            onSelectOne?.(draws.id);
                          } else {
                            onDeselectOne?.(draws.id);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack alignItems="center" direction="row" spacing={2}>
                        <Typography variant="subtitle2">{draws.name}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{currencyBrlFormat(draws.amount)}</TableCell>
                    <TableCell>{currencyBrlFormat(draws.secondaryAmount)}</TableCell>
                    <TableCell>{currencyBrlFormat(draws.thirdAmount)}</TableCell>
                    <TableCell>
                      <Stack alignItems="center" direction="row" spacing={4}>
                        <PencilSquareIcon
                          height={20}
                          cursor={"pointer"}
                          id={draws.id}
                          onClick={() =>
                            handleEdit(
                              draws.id,
                              draws.amount,
                              draws.secondaryAmount,
                              draws.thirdAmount
                            )
                          }
                        />
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Scrollbar>
    </Card>
  );
};

DrawsTable.propTypes = {
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
  selected: PropTypes.array,
};
