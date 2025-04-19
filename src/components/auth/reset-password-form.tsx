'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Controller, useForm } from 'react-hook-form';
import { z as zod } from 'zod';

import { useAuth } from '@/lib/auth/client';

const schema = zod.object({
  email: zod.string().min(1, { message: 'Email is required' }).email({ message: 'Invalid email address' }),
});

type Values = zod.infer<typeof schema>;

const defaultValues = { email: '' } satisfies Values;

export function ResetPasswordForm(): React.JSX.Element {
  const { resetPassword } = useAuth();
  const [isPending, setIsPending] = React.useState<boolean>(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({ defaultValues, resolver: zodResolver(schema) });

  const onSubmit = React.useCallback(
    async (values: Values): Promise<void> => {
      setIsPending(true);
      setSuccessMessage(null);

      try {
        const result: any = await resetPassword(values);
        if (result.error) {
          setError('root', { type: 'server', message: result.error });
        } else {
          setSuccessMessage('Recovery link sent! Please check your email.');
        }
      } catch (error) {
        setError('root', { type: 'server', message: 'An unexpected error occurred' });
      } finally {
        setIsPending(false);
      }
    },
    [resetPassword, setError]
  );

  return (
    <Stack spacing={4}>
      <Typography variant="h5">Reset password</Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <FormControl error={Boolean(errors.email)}>
                <InputLabel>Email address</InputLabel>
                <OutlinedInput {...field} label="Email address" type="email" disabled={isPending} />
                {errors.email ? <FormHelperText>{errors.email.message}</FormHelperText> : null}
              </FormControl>
            )}
          />
          {errors.root ? <Alert color="error">{errors.root.message}</Alert> : null}
          {successMessage ? <Alert color="success">{successMessage}</Alert> : null}
          <Button disabled={isPending} type="submit" variant="contained">
            {isPending ? 'Sending...' : 'Send recovery link'}
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}
