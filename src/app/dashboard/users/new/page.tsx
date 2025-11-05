'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';

import { UserForm } from '@/components/dashboard/user/user-form';

export default function NewUserPage(): React.JSX.Element {
  const router = useRouter();
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = (data: any) => {
    // In a real app, you would make an API call to create the user
    console.log('Creating user:', data);
    setSuccess(true);
    setTimeout(() => {
      router.push('/dashboard/users');
    }, 1500);
  };

  const handleCancel = () => {
    router.push('/dashboard/users');
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" gutterBottom>
          新增用户
        </Typography>
        <Typography variant="body2" color="text.secondary">
          创建一个新的系统用户
        </Typography>
      </Box>

      {success && (
        <Alert severity="success">
          用户创建成功！正在跳转到用户列表...
        </Alert>
      )}

      <UserForm onSubmit={handleSubmit} onCancel={handleCancel} />
    </Stack>
  );
}
