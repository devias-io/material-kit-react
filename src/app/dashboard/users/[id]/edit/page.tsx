'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import dayjs from 'dayjs';

import { UserForm } from '@/components/dashboard/user/user-form';

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

export default function EditUserPage({ params }: { params: { id: string } }): React.JSX.Element {
  const router = useRouter();
  const [success, setSuccess] = React.useState(false);
  const [user, setUser] = React.useState<User | null>(null);

  // Mock data - in a real app, you would fetch this from an API
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

  // Find the user with the matching ID
  React.useEffect(() => {
    const foundUser = mockUsers.find((u) => u.id === params.id);
    if (foundUser) {
      setUser(foundUser);
    } else {
      // User not found, redirect to user list
      router.push('/dashboard/users');
    }
  }, [params.id, router]);

  const handleSubmit = (data: any) => {
    // In a real app, you would make an API call to update the user
    console.log('Updating user:', data);
    setSuccess(true);
    setTimeout(() => {
      router.push('/dashboard/users');
    }, 1500);
  };

  const handleCancel = () => {
    router.push('/dashboard/users');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" gutterBottom>
          编辑用户
        </Typography>
        <Typography variant="body2" color="text.secondary">
          修改用户信息
        </Typography>
      </Box>

      {success && (
        <Alert severity="success">
          用户更新成功！正在跳转到用户列表...
        </Alert>
      )}

      <UserForm
        isEditMode={true}
        initialData={user}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </Stack>
  );
}
