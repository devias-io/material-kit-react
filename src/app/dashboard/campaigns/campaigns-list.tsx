'use client';

import * as React from 'react';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import dayjs from 'dayjs';

// Sample data for campaigns
const campaigns = [
  { id: 'CMP001', name: 'Summer Fundraiser 2024', status: 'Active', startDate: '2024-06-01', endDate: '2024-08-31' },
  { id: 'CMP002', name: 'Annual Gala Dinner', status: 'Completed', startDate: '2024-04-15', endDate: '2024-04-15' },
  { id: 'CMP003', name: 'Community Outreach Program', status: 'Active', startDate: '2024-07-01', endDate: '2024-09-30' },
  { id: 'CMP004', name: 'Holiday Toy Drive', status: 'Planned', startDate: '2024-11-01', endDate: '2024-12-20' },
];

const statusMap = {
  Active: { label: 'Active', color: 'success' },
  Completed: { label: 'Completed', color: 'default' },
  Planned: { label: 'Planned', color: 'primary' },
} as const;


export function CampaignsList(): React.JSX.Element {
  return (
    <Card>
      <CardHeader
        action={
          <Button color="primary" startIcon={<PlusIcon />} variant="contained">
            Create Campaign
          </Button>
        }
        title="Campaigns"
      />
      <Divider />
      <Box component={Paper} sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow>
              <TableCell>Campaign Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {campaigns.map((campaign) => {
              const { label, color } = statusMap[campaign.status] ?? { label: 'Unknown', color: 'default' };

              return (
                <TableRow hover key={campaign.id}>
                  <TableCell>{campaign.name}</TableCell>
                  <TableCell>
                    <Chip label={label} size="small" color={color} />
                  </TableCell>
                  <TableCell>{dayjs(campaign.startDate).format('MMM D, YYYY')}</TableCell>
                  <TableCell>{dayjs(campaign.endDate).format('MMM D, YYYY')}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
    </Card>
  );
}