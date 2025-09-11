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
import { Eye as EyeIcon } from '@phosphor-icons/react/dist/ssr/Eye';
import { EyeSlash as EyeSlashIcon } from '@phosphor-icons/react/dist/ssr/EyeSlash';
import { Controller, useForm } from 'react-hook-form';
import { z as zod } from 'zod';

const schema = zod.object({
  currentPassword: zod.string().min(1, { message: 'Senha atual é obrigatória' }),
  newPassword: zod
    .string()
    .min(6, { message: 'Nova senha deve ter pelo menos 6 caracteres' })
    .regex(/[A-Za-z]/, { message: 'Nova senha deve conter pelo menos uma letra' })
    .regex(/[0-9]/, { message: 'Nova senha deve conter pelo menos um número' }),
  confirmPassword: zod.string().min(1, { message: 'Confirmação é obrigatória' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Nova senha e confirmação não coincidem',
  path: ['confirmPassword'],
});

type Values = zod.infer<typeof schema>;

const defaultValues = { 
  currentPassword: '', 
  newPassword: '', 
  confirmPassword: '' 
} satisfies Values;

interface ChangePasswordFormProps {
  userEmail: string;
  onSuccess: () => void;
}

export function ChangePasswordForm({ userEmail, onSuccess }: ChangePasswordFormProps): React.JSX.Element {
  const [showCurrentPassword, setShowCurrentPassword] = React.useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = React.useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState<boolean>(false);
  const [isPending, setIsPending] = React.useState<boolean>(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({ defaultValues, resolver: zodResolver(schema) });

  const onSubmit = React.useCallback(
    async (values: Values): Promise<void> => {
      setIsPending(true);
      console.log('🔐 Alterando senha para:', userEmail);

      try {
        const response = await fetch('/api/auth/change-password', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Senha alterada com sucesso');
          
          // Atualizar localStorage se necessário
          const userData = localStorage.getItem('user-data');
          if (userData) {
            const user = JSON.parse(userData);
            user.mustChangePassword = false;
            localStorage.setItem('user-data', JSON.stringify(user));
          }
          
          onSuccess();
        } else {
          const errorData = await response.json();
          console.log('❌ Erro ao alterar senha:', errorData);
          setError('root', { type: 'server', message: errorData.error });
        }
      } catch (error) {
        console.error('💥 Erro na alteração:', error);
        setError('root', { type: 'server', message: 'Erro de conexão. Tente novamente.' });
      } finally {
        setIsPending(false);
      }
    },
    [userEmail, onSuccess, setError]
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={3}>
        <Controller
          control={control}
          name="currentPassword"
          render={({ field }) => (
            <FormControl error={Boolean(errors.currentPassword)}>
              <InputLabel sx={{ color: '#ccc' }}>Senha Atual</InputLabel>
              <OutlinedInput
                {...field}
                endAdornment={
                  showCurrentPassword ? (
                    <EyeIcon
                      cursor="pointer"
                      fontSize="var(--icon-fontSize-md)"
                      onClick={() => setShowCurrentPassword(false)}
                      style={{ color: '#ccc' }}
                    />
                  ) : (
                    <EyeSlashIcon
                      cursor="pointer"
                      fontSize="var(--icon-fontSize-md)"
                      onClick={() => setShowCurrentPassword(true)}
                      style={{ color: '#ccc' }}
                    />
                  )
                }
                label="Senha Atual"
                type={showCurrentPassword ? 'text' : 'password'}
                sx={{
                  backgroundColor: '#111',
                  color: '#fff',
                  borderRadius: '12px',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#555' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00FF00' },
                }}
              />
              {errors.currentPassword ? <FormHelperText>{errors.currentPassword.message}</FormHelperText> : null}
            </FormControl>
          )}
        />

        <Controller
          control={control}
          name="newPassword"
          render={({ field }) => (
            <FormControl error={Boolean(errors.newPassword)}>
              <InputLabel sx={{ color: '#ccc' }}>Nova Senha</InputLabel>
              <OutlinedInput
                {...field}
                endAdornment={
                  showNewPassword ? (
                    <EyeIcon
                      cursor="pointer"
                      fontSize="var(--icon-fontSize-md)"
                      onClick={() => setShowNewPassword(false)}
                      style={{ color: '#ccc' }}
                    />
                  ) : (
                    <EyeSlashIcon
                      cursor="pointer"
                      fontSize="var(--icon-fontSize-md)"
                      onClick={() => setShowNewPassword(true)}
                      style={{ color: '#ccc' }}
                    />
                  )
                }
                label="Nova Senha"
                type={showNewPassword ? 'text' : 'password'}
                sx={{
                  backgroundColor: '#111',
                  color: '#fff',
                  borderRadius: '12px',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#555' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00FF00' },
                }}
              />
              {errors.newPassword ? <FormHelperText>{errors.newPassword.message}</FormHelperText> : null}
            </FormControl>
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field }) => (
            <FormControl error={Boolean(errors.confirmPassword)}>
              <InputLabel sx={{ color: '#ccc' }}>Confirmar Nova Senha</InputLabel>
              <OutlinedInput
                {...field}
                endAdornment={
                  showConfirmPassword ? (
                    <EyeIcon
                      cursor="pointer"
                      fontSize="var(--icon-fontSize-md)"
                      onClick={() => setShowConfirmPassword(false)}
                      style={{ color: '#ccc' }}
                    />
                  ) : (
                    <EyeSlashIcon
                      cursor="pointer"
                      fontSize="var(--icon-fontSize-md)"
                      onClick={() => setShowConfirmPassword(true)}
                      style={{ color: '#ccc' }}
                    />
                  )
                }
                label="Confirmar Nova Senha"
                type={showConfirmPassword ? 'text' : 'password'}
                sx={{
                  backgroundColor: '#111',
                  color: '#fff',
                  borderRadius: '12px',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#555' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00FF00' },
                }}
              />
              {errors.confirmPassword ? <FormHelperText>{errors.confirmPassword.message}</FormHelperText> : null}
            </FormControl>
          )}
        />

        <Typography variant="caption" sx={{ color: '#999', textAlign: 'left' }}>
          💡 A nova senha deve ter pelo menos 6 caracteres, incluindo letras e números.
        </Typography>

        {errors.root ? <Alert color="error">{errors.root.message}</Alert> : null}

        <Button
          disabled={isPending}
          type="submit"
          sx={{
            backgroundColor: '#00FF00',
            color: '#000',
            fontWeight: 'bold',
            borderRadius: '12px',
            paddingY: 1.5,
            fontSize: '1rem',
            '&:hover': {
              backgroundColor: '#00e600',
            },
            '&:disabled': {
              backgroundColor: '#555',
              color: '#ccc',
            },
          }}
        >
          {isPending ? '🔐 Alterando...' : '✅ Alterar Senha'}
        </Button>
      </Stack>
    </form>
  );
}