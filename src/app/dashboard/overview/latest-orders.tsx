'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import SvgIcon from '@mui/material/SvgIcon';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { DotsThreeVertical as DotsThreeVerticalIcon } from '@phosphor-icons/react/dist/ssr/DotsThreeVertical';
import type { SxProps } from '@mui/material/styles';

// Sample data matching your new design
const clients = [
  { id: 1, name: 'Roohbaba', clientId: '#123456', mobile: '9876543210', regDate: '10/05/25', amount: '₹5,000' },
  { id: 2, name: 'Roohbaba', clientId: '#123456', mobile: '9876543210', regDate: '10/05/25', amount: '₹5,000' },
  { id: 3, name: 'Roohbaba', clientId: '#123456', mobile: '9876543210', regDate: '10/05/25', amount: '₹5,000' },
  { id: 4, name: 'Roohbaba', clientId: '#123456', mobile: '9876543210', regDate: '10/05/25', amount: '₹5,000' },
];

export function LatestOrders({ sx }: { sx?: SxProps }): React.JSX.Element {
  return (
    <Card sx={sx}>
      <CardHeader title="Recent Clients" action={<Button size="small">Filter</Button>} />
      <Box sx={{ overflowX: 'auto' }}>
        {/* Changed minWidth from 800 to 1200 */}
        <Table sx={{ minWidth: 1400 }}>
          <TableHead>
            <TableRow>
              <TableCell>Sr. No.</TableCell>
              <TableCell>Client name</TableCell>
              <TableCell>Client ID</TableCell>
              <TableCell>Mobile No.</TableCell>
              <TableCell>Reg. Date</TableCell>
              <TableCell>Reg. Amount</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.map((client) => (
              <TableRow hover key={client.id}>
                <TableCell>{client.id}</TableCell>
                <TableCell>{client.name}</TableCell>
                <TableCell>{client.clientId}</TableCell>
                <TableCell>{client.mobile}</TableCell>
                <TableCell>{client.regDate}</TableCell>
                <TableCell>{client.amount}</TableCell>
                <TableCell>
                  <IconButton>
                    <SvgIcon>
                      <DotsThreeVerticalIcon />
                    </SvgIcon>
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      <Divider />
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <Button size="small">View all</Button>
      </CardActions>
    </Card>
  );
}