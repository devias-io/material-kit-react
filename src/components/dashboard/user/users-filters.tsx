'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';

interface UsersFiltersProps {
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  selectedRole?: string;
  onRoleChange?: (role: string) => void;
}

export function UsersFilters({
  searchQuery = '',
  onSearchQueryChange = () => {},
  selectedRole = 'all',
  onRoleChange = () => {},
}: UsersFiltersProps): React.JSX.Element {
  const roles = ['all', 'Admin', 'Editor', 'Viewer'];

  return (
    <Card sx={{ p: 2 }}>
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <Box sx={{ flex: 1, minWidth: '250px' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Search
          </Typography>
          <OutlinedInput
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            fullWidth
            placeholder="Search by name, email, or phone"
            startAdornment={
              <InputAdornment position="start">
                <MagnifyingGlassIcon fontSize="var(--icon-fontSize-md)" />
              </InputAdornment>
            }
          />
        </Box>
        <Box sx={{ width: '200px' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Role
          </Typography>
          <Select
            value={selectedRole}
            onChange={(event) => onRoleChange(event.target.value)}
            fullWidth
            displayEmpty
            input={<OutlinedInput />}
          >
            {roles.map((role) => (
              <MenuItem key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </Box>
      </Stack>
    </Card>
  );
}
