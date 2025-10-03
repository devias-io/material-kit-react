'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Eye as EyeIcon } from '@phosphor-icons/react/dist/ssr/Eye';
import { EyeSlash as EyeSlashIcon } from '@phosphor-icons/react/dist/ssr/EyeSlash';
import { Controller, useForm } from 'react-hook-form';
import { z as zod } from 'zod';

import { paths } from '@/paths';
import { authClient } from '@/lib/auth/client';
import { useUser } from '@/hooks/use-user';

const schema = zod.object({
  email: zod.string().min(1, { message: 'Email é obrigatório' }).email(),
  password: zod.string().min(1, { message: 'Senha é obrigatória' }),
});

type Values = zod.infer<typeof schema>;

const defaultValues = { email: '', password: '' } satisfies Values;

export function SignInForm(): React.JSX.Element {
  const router = useRouter();
  const { checkSession } = useUser();

  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [isPending, setIsPending] = React.useState<boolean>(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({ defaultValues, resolver: zodResolver(schema) });

  // 🆕 FUNÇÃO ATUALIZADA - Verifica mustChangePassword
  const onSubmit = React.useCallback(
    async (values: Values): Promise<void> => {
      setIsPending(true);
      console.log('🚀 Tentando login com:', values);

      try {
        const { data, error } = await authClient.signInWithPassword(values);
        console.log('📝 Resultado do signInWithPassword:', { error, data });

        if (error) {
          console.log('❌ Erro no login:', error);
          setError('root', { type: 'server', message: error });
          return;
        }

        const mustChangePassword = data?.user?.mustChangePassword;

        console.log('✅ Login bem-sucedido, verificando sessão...');
        if (checkSession) {
          checkSession().catch(err => {
            console.error('⚠️ Erro ao atualizar sessão:', err);
          });
        }

        if (mustChangePassword) {
          console.log('🔐 Usuário precisa alterar senha - redirecionando...');
          router.push('/auth/change-password');
          return;
        }

        console.log('🚀 Redirecionando para dashboard...');
        router.push('/dashboard');

      } catch (err) {
        console.error('💥 Erro inesperado no login:', err);
        setError('root', { type: 'server', message: 'Erro inesperado. Tente novamente.' });
      } finally {
        setIsPending(false);
      }
    },
    [checkSession, router, setError]
  );

  return (
    <Stack spacing={4}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <FormControl error={Boolean(errors.email)}>
                <InputLabel sx={{ color: '#ccc' }}>E-mail</InputLabel>
                <OutlinedInput
                  {...field}
                  label="E-mail"
                  type="email"
                  sx={{
                    backgroundColor: '#111',
                    color: '#fff',
                    borderRadius: '30px',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333' },
                  }}
                />
                {errors.email ? <FormHelperText>{errors.email.message}</FormHelperText> : null}
              </FormControl>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <FormControl error={Boolean(errors.password)}>
                <InputLabel sx={{ color: '#ccc' }}>Senha</InputLabel>
                <OutlinedInput
                  {...field}
                  endAdornment={
                    showPassword ? (
                      <EyeIcon
                        cursor="pointer"
                        fontSize="var(--icon-fontSize-md)"
                        onClick={(): void => setShowPassword(false)}
                      />
                    ) : (
                      <EyeSlashIcon
                        cursor="pointer"
                        fontSize="var(--icon-fontSize-md)"
                        onClick={(): void => setShowPassword(true)}
                      />
                    )
                  }
                  label="Senha"
                  type={showPassword ? 'text' : 'password'}
                  sx={{
                    backgroundColor: '#111',
                    color: '#fff',
                    borderRadius: '30px',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333' },
                  }}
                />
                {errors.password ? <FormHelperText>{errors.password.message}</FormHelperText> : null}
              </FormControl>
            )}
          />

          <div>
            <Link component={RouterLink} href={paths.auth.resetPassword} variant="subtitle2" sx={{ color: '#00FF00' }}>
              Esqueceu a senha?
            </Link>
          </div>

          {errors.root ? <Alert color="error">{errors.root.message}</Alert> : null}

          <Button
            disabled={isPending}
            type="submit"
            sx={{
              backgroundColor: '#00FF00',
              color: '#000',
              fontWeight: 'bold',
              borderRadius: '30px',
              paddingY: 1.5,
              '&:hover': {
                backgroundColor: '#00e600',
              },
            }}
          >
            Entrar
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}