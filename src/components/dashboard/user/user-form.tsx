'use client';

import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { UploadIcon } from '@phosphor-icons/react/dist/ssr/Upload';

interface UserFormProps {
  isEditMode?: boolean;
  initialData?: {
    id?: string;
    avatar?: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: 'Admin' | 'Editor' | 'Viewer';
    password?: string;
    timezone?: string;
    language?: string;
    status?: 'Active' | 'Disabled';
  };
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
}

export function UserForm({
  isEditMode = false,
  initialData = {},
  onSubmit = () => {},
  onCancel = () => {},
}: UserFormProps): React.JSX.Element {
  const [formData, setFormData] = React.useState({
    name: initialData.name || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    role: initialData.role || 'Viewer',
    password: '',
    confirmPassword: '',
    timezone: initialData.timezone || 'US/Eastern',
    language: initialData.language || 'English',
    status: initialData.status || 'Active',
  });

  const [errors, setErrors] = React.useState({});

  const timezones = ['US/Eastern', 'US/Central', 'US/Mountain', 'US/Pacific', 'UTC', 'Europe/London', 'Asia/Tokyo'];
  const languages = ['English', 'Simplified Chinese', 'Spanish', 'French', 'German', 'Japanese'];
  const roles = ['Admin', 'Editor', 'Viewer'];
  const statuses = ['Active', 'Disabled'];

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[+]?[(]?[0-9]{3}[)]?[-s.]?[0-9]{3}[-s.]?[0-9]{4,6}$/im.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    if (!formData.timezone) {
      newErrors.timezone = 'Timezone is required';
    }

    if (!formData.language) {
      newErrors.language = 'Language is required';
    }

    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    if (!isEditMode) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (validateForm()) {
      const submitData = { ...formData };
      if (isEditMode) {
        delete submitData.password;
        delete submitData.confirmPassword;
      }
      onSubmit(submitData);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          {isEditMode ? 'Edit User' : 'Create User'}
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {/* Account Information */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Account Information
              </Typography>
              <Stack spacing={2}>
                {/* Avatar Upload */}
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Avatar
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                      src={initialData.avatar || '/assets/avatar.png'}
                      sx={{ width: 80, height: 80 }}
                    />
                    <Button
                      variant="outlined"
                      startIcon={<UploadIcon fontSize="var(--icon-fontSize-md)" />}
                    >
                      Upload
                    </Button>
                    <Typography variant="body2" color="text.secondary">
                      PNG or JPEG, 400x400px (optional)
                    </Typography>
                  </Stack>
                </Box>

                {/* Name */}
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={!!errors.name}
                  helperText={errors.name}
                  required
                />

                {/* Email */}
                <TextField
                  fullWidth
                  label="Email address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  required
                />

                {/* Phone */}
                <TextField
                  fullWidth
                  label="Phone number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  error={!!errors.phone}
                  helperText={errors.phone}
                  required
                />

                {/* Role */}
                <FormControl fullWidth error={!!errors.role} required>
                  <InputLabel>Role</InputLabel>
                  <Select
                    name="role"
                    value={formData.role}
                    label="Role"
                    onChange={handleChange}
                  >
                    {roles.map((role) => (
                      <MenuItem key={role} value={role}>
                        {role}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
                </FormControl>

                {/* Password (only for new users) */}
                {!isEditMode && (
                  <>
                    <TextField
                      fullWidth
                      label="Password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      error={!!errors.password}
                      helperText={errors.password}
                      required
                    />
                    <TextField
                      fullWidth
                      label="Confirm Password"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      error={!!errors.confirmPassword}
                      helperText={errors.confirmPassword}
                      required
                    />
                  </>
                )}
              </Stack>
            </Box>

            <Divider />

            {/* Additional Information */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Additional Information
              </Typography>
              <Stack spacing={2}>
                {/* Timezone */}
                <FormControl fullWidth error={!!errors.timezone} required>
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    name="timezone"
                    value={formData.timezone}
                    label="Timezone"
                    onChange={handleChange}
                  >
                    {timezones.map((timezone) => (
                      <MenuItem key={timezone} value={timezone}>
                        {timezone}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.timezone && <FormHelperText>{errors.timezone}</FormHelperText>}
                </FormControl>

                {/* Language */}
                <FormControl fullWidth error={!!errors.language} required>
                  <InputLabel>Language</InputLabel>
                  <Select
                    name="language"
                    value={formData.language}
                    label="Language"
                    onChange={handleChange}
                  >
                    {languages.map((language) => (
                      <MenuItem key={language} value={language}>
                        {language}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.language && <FormHelperText>{errors.language}</FormHelperText>}
                </FormControl>

                {/* Status */}
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Status
                  </Typography>
                  <RadioGroup
                    row
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    {statuses.map((status) => (
                      <Box key={status} sx={{ mr: 3 }}>
                        <Radio
                          value={status}
                          checked={formData.status === status}
                          sx={{ mr: 1 }}
                        />
                        <Typography variant="body2" display="inline">
                          {status}
                        </Typography>
                      </Box>
                    ))}
                  </RadioGroup>
                  {errors.status && <FormHelperText error>{errors.status}</FormHelperText>}
                </Box>
              </Stack>
            </Box>

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" color="primary">
                {isEditMode ? 'Update User' : 'Create User'}
              </Button>
            </Stack>
          </Stack>
        </form>
      </CardContent>
    </Card>
  );
}
