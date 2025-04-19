'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import Grid from '@mui/material/Unstable_Grid2';
import { Controller, useForm } from 'react-hook-form';
import { z as zod } from 'zod';

import { useAuth } from '@/lib/auth/client';

const states = [
  { value: 'alabama', label: 'Alabama' },
  { value: 'new-york', label: 'New York' },
  { value: 'san-francisco', label: 'San Francisco' },
  { value: 'los-angeles', label: 'Los Angeles' },
] as const;

const schema = zod.object({
  firstName: zod.string().min(1, { message: 'First name is required' }),
  lastName: zod.string().min(1, { message: 'Last name is required' }),
  email: zod.string().min(1, { message: 'Email is required' }).email({ message: 'Invalid email address' }),
  phone: zod.string().optional(),
  state: zod.string().optional(),
  city: zod.string().optional(),
});

type Values = zod.infer<typeof schema>;

export function AccountDetailsForm(): React.JSX.Element {
  const { currentUser, isLoading } = useAuth();
  const [isPending, setIsPending] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    defaultValues: {
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
      email: currentUser?.email || '',
      phone: '',
      state: 'new-york',
      city: '',
    },
    resolver: zodResolver(schema),
  });

  const onSubmit = React.useCallback(async (values: Values): Promise<void> => {
    setIsPending(true);
    setError(null);

    try {
      // Note: The current auth-client doesn't have an updateUser method.
      // This is a placeholder for where you'd call an API to update user details.
      // You may need to extend the auth-client.ts with an updateUser method in authService.
      // For now, we'll simulate a successful update.
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

      // If you add an updateUser method to authService, it would look something like:
      // const result = await authService.updateUser(values);
      // if (!result.success) {
      //   throw new Error(result.message || 'Failed to update profile');
      // }
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsPending(false);
    }
  }, []);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader subheader="The information can be edited" title="Profile" />
        <Divider />
        <CardContent>
          <Grid container spacing={3}>
            <Grid md={6} xs={12}>
              <Controller
                control={control}
                name="firstName"
                render={({ field }) => (
                  <FormControl fullWidth required error={Boolean(errors.firstName)}>
                    <InputLabel>First name</InputLabel>
                    <OutlinedInput {...field} label="First name" disabled={isPending} />
                    {errors.firstName ? <FormHelperText>{errors.firstName.message}</FormHelperText> : null}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid md={6} xs={12}>
              <Controller
                control={control}
                name="lastName"
                render={({ field }) => (
                  <FormControl fullWidth required error={Boolean(errors.lastName)}>
                    <InputLabel>Last name</InputLabel>
                    <OutlinedInput {...field} label="Last name" disabled={isPending} />
                    {errors.lastName ? <FormHelperText>{errors.lastName.message}</FormHelperText> : null}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid md={6} xs={12}>
              <Controller
                control={control}
                name="email"
                render={({ field }) => (
                  <FormControl fullWidth required error={Boolean(errors.email)}>
                    <InputLabel>Email address</InputLabel>
                    <OutlinedInput {...field} label="Email address" type="email" disabled={isPending} />
                    {errors.email ? <FormHelperText>{errors.email.message}</FormHelperText> : null}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid md={6} xs={12}>
              <Controller
                control={control}
                name="phone"
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Phone number</InputLabel>
                    <OutlinedInput {...field} label="Phone number" type="tel" disabled={isPending} />
                    {errors.phone ? <FormHelperText>{errors.phone.message}</FormHelperText> : null}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid md={6} xs={12}>
              <Controller
                control={control}
                name="state"
                render={({ field }) => (
                  <FormControl fullWidth error={Boolean(errors.state)}>
                    <InputLabel>State</InputLabel>
                    <Select {...field} label="State" variant="outlined" disabled={isPending}>
                      {states.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.state ? <FormHelperText>{errors.state.message}</FormHelperText> : null}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid md={6} xs={12}>
              <Controller
                control={control}
                name="city"
                render={({ field }) => (
                  <FormControl fullWidth error={Boolean(errors.city)}>
                    <InputLabel>City</InputLabel>
                    <OutlinedInput {...field} label="City" disabled={isPending} />
                    {errors.city ? <FormHelperText>{errors.city.message}</FormHelperText> : null}
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>
          {error ? (
            <Alert color="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          ) : null}
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-end' }}>
          <Button variant="contained" type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save details'}
          </Button>
        </CardActions>
      </Card>
    </form>
  );
}
