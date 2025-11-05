'use client';

import * as React from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import dayjs from 'dayjs';

import { UsersFilters } from '@/components/dashboard/user/users-filters';
import { UsersTable } from '@/components/dashboard/user/users-table';

interface User {
  id: string;
  avatar: string;
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  phone: string;
  createdAt: Date;
  status: 'Active' | 'Disabled' | 'Pending';
  timezone: string;
  language: string;
}

export default function UsersPage(): React.JSX.Element {
  const [users, setUsers] = React.useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = React.useState<User[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedRole, setSelectedRole] = React.useState('all');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  // Mock data
  React.useEffect(() => {
    const mockUsers: User[] = [
      {
        id: 'USR-010',
        name: 'Alcides Antonio',
        avatar: '/assets/avatar-10.png',
        email: 'alcides.antonio@devias.io',
        role: 'Admin',
        phone: '908-691-3242',
        createdAt: dayjs().subtract(2, 'hours').toDate(),
        status: 'Active',
        timezone: 'US/Eastern',
        language: 'English',
      },
      {
        id: 'USR-009',
        name: 'Marcus Finn',
        avatar: '/assets/avatar-9.png',
        email: 'marcus.finn@devias.io',
        role: 'Editor',
        phone: '415-907-2647',
        createdAt: dayjs().subtract(1, 'day').toDate(),
        status: 'Active',
        timezone: 'US/Pacific',
        language: 'English',
      },
      {
        id: 'USR-008',
        name: 'Jie Yan',
        avatar: '/assets/avatar-8.png',
        email: 'jie.yan.song@devias.io',
        role: 'Viewer',
        phone: '770-635-2682',
        createdAt: dayjs().subtract(3, 'days').toDate(),
        status: 'Disabled',
        timezone: 'Asia/Tokyo',
        language: 'Simplified Chinese',
      },
      {
        id: 'USR-007',
        name: 'Nasimiyu Danai',
        avatar: '/assets/avatar-7.png',
        email: 'nasimiyu.danai@devias.io',
        role: 'Editor',
        phone: '801-301-7894',
        createdAt: dayjs().subtract(1, 'week').toDate(),
        status: 'Pending',
        timezone: 'UTC',
        language: 'English',
      },
      {
        id: 'USR-006',
        name: 'Iulia Albu',
        avatar: '/assets/avatar-6.png',
        email: 'iulia.albu@devias.io',
        role: 'Admin',
        phone: '313-812-8947',
        createdAt: dayjs().subtract(2, 'weeks').toDate(),
        status: 'Active',
        timezone: 'Europe/London',
        language: 'French',
      },
      {
        id: 'USR-005',
        name: 'Fran Perez',
        avatar: '/assets/avatar-5.png',
        email: 'fran.perez@devias.io',
        role: 'Viewer',
        phone: '712-351-5711',
        createdAt: dayjs().subtract(1, 'month').toDate(),
        status: 'Active',
        timezone: 'US/Central',
        language: 'Spanish',
      },
      {
        id: 'USR-004',
        name: 'Penjani Inyene',
        avatar: '/assets/avatar-4.png',
        email: 'penjani.inyene@devias.io',
        role: 'Editor',
        phone: '858-602-3409',
        createdAt: dayjs().subtract(2, 'months').toDate(),
        status: 'Active',
        timezone: 'US/Mountain',
        language: 'English',
      },
      {
        id: 'USR-003',
        name: 'Carson Darrin',
        avatar: '/assets/avatar-3.png',
        email: 'carson.darrin@devias.io',
        role: 'Viewer',
        phone: '304-428-3097',
        createdAt: dayjs().subtract(3, 'months').toDate(),
        status: 'Disabled',
        timezone: 'US/Eastern',
        language: 'English',
      },
      {
        id: 'USR-002',
        name: 'Siegbert Gottfried',
        avatar: '/assets/avatar-2.png',
        email: 'siegbert.gottfried@devias.io',
        role: 'Editor',
        phone: '702-661-1654',
        createdAt: dayjs().subtract(6, 'months').toDate(),
        status: 'Active',
        timezone: 'US/Pacific',
        language: 'German',
      },
      {
        id: 'USR-001',
        name: 'Demo User',
        avatar: '/assets/avatar-1.png',
        email: 'demo.user@devias.io',
        role: 'Admin',
        phone: '555-123-4567',
        createdAt: dayjs().subtract(1, 'year').toDate(),
        status: 'Active',
        timezone: 'US/Eastern',
        language: 'English',
      },
    ];

    setUsers(mockUsers);
    setFilteredUsers(mockUsers);
  }, []);

  // Filter users based on search query and selected role
  React.useEffect(() => {
    let result = [...users];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.phone.toLowerCase().includes(query)
      );
    }

    if (selectedRole && selectedRole !== 'all') {
      result = result.filter((user) => user.role === selectedRole);
    }

    setFilteredUsers(result);
    setPage(0); // Reset to first page when filters change
  }, [searchQuery, selectedRole, users]);

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDeleteUser = (id: string) => {
    const updatedUsers = users.filter((user) => user.id !== id);
    setUsers(updatedUsers);
    // In a real app, you would also make an API call to delete the user
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" gutterBottom>
            用户管理
          </Typography>
          <Typography variant="body2" color="text.secondary">
            管理系统用户，包括新增、编辑和删除用户
          </Typography>
        </Box>
        <Button
          component="a"
          href="/dashboard/users/new"
          startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />}
          variant="contained"
          color="primary"
        >
          + 添加用户
        </Button>
      </Stack>

      <UsersFilters
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        selectedRole={selectedRole}
        onRoleChange={setSelectedRole}
      />

      <UsersTable
        count={filteredUsers.length}
        rows={filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onDeleteUser={handleDeleteUser}
      />
    </Stack>
  );
}
