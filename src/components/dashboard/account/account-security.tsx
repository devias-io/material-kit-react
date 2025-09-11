'use client';

import * as React from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Grid from '@mui/material/Unstable_Grid2';
import Alert from '@mui/material/Alert';
import FormHelperText from '@mui/material/FormHelperText';
import { Eye as EyeIcon } from '@phosphor-icons/react/dist/ssr/Eye';
import { EyeSlash as EyeSlashIcon } from '@phosphor-icons/react/dist/ssr/EyeSlash';

interface AccountSecurityProps {
  user: any;
}

export function AccountSecurity({ user }: AccountSecurityProps): React.JSX.Element {
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  
  const [formData, setFormData] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Senha atual é obrigatória';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'Nova senha é obrigatória';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Nova senha deve ter pelo menos 6 caracteres';
    } else if (!/[A-Za-z]/.test(formData.newPassword)) {
      newErrors.newPassword = 'Nova senha deve conter pelo menos uma letra';
    } else if (!/[0-9]/.test(formData.newPassword)) {
      newErrors.newPassword = 'Nova senha deve conter pelo menos um número';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess(true);
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => setSuccess(false), 5000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erro ao alterar senha');
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card sx={{ 
        backgroundColor: '#FFFFFF', 
        borderRadius: 3, 
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <CardHeader 
          title="Segurança" 
          subheader="Altere sua senha para manter sua conta segura"
          sx={{
            '& .MuiCardHeader-title': {
              color: '#1E293B',
              fontWeight: '600',
              fontSize: '1.1rem'
            },
            '& .MuiCardHeader-subheader': {
              color: '#64748B'
            }
          }}
        />
        <Divider />
        <CardContent sx={{ p: 3 }}>
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              ✅ Senha alterada com sucesso!
            </Alert>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid xs={12}>
              <FormControl fullWidth error={!!errors.currentPassword}>
                <InputLabel>Senha Atual</InputLabel>
                <OutlinedInput 
                  value={formData.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                  type={showCurrentPassword ? 'text' : 'password'}
                  endAdornment={
                    showCurrentPassword ? (
                      <EyeIcon
                        cursor="pointer"
                        fontSize="var(--icon-fontSize-md)"
                        onClick={() => setShowCurrentPassword(false)}
                        style={{ color: '#64748B' }}
                      />
                    ) : (
                      <EyeSlashIcon
                        cursor="pointer"
                        fontSize="var(--icon-fontSize-md)"
                        onClick={() => setShowCurrentPassword(true)}
                        style={{ color: '#64748B' }}
                      />
                    )
                  }
                  label="Senha Atual" 
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6', borderWidth: '2px' }
                  }}
                />
                {errors.currentPassword && <FormHelperText>{errors.currentPassword}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid md={6} xs={12}>
              <FormControl fullWidth error={!!errors.newPassword}>
                <InputLabel>Nova Senha</InputLabel>
                <OutlinedInput 
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  type={showNewPassword ? 'text' : 'password'}
                  endAdornment={
                    showNewPassword ? (
                      <EyeIcon
                        cursor="pointer"
                        fontSize="var(--icon-fontSize-md)"
                        onClick={() => setShowNewPassword(false)}
                        style={{ color: '#64748B' }}
                      />
                    ) : (
                      <EyeSlashIcon
                        cursor="pointer"
                        fontSize="var(--icon-fontSize-md)"
                        onClick={() => setShowNewPassword(true)}
                        style={{ color: '#64748B' }}
                      />
                    )
                  }
                  label="Nova Senha" 
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6', borderWidth: '2px' }
                  }}
                />
                {errors.newPassword && <FormHelperText>{errors.newPassword}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid md={6} xs={12}>
              <FormControl fullWidth error={!!errors.confirmPassword}>
                <InputLabel>Confirmar Nova Senha</InputLabel>
                <OutlinedInput 
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  type={showConfirmPassword ? 'text' : 'password'}
                  endAdornment={
                    showConfirmPassword ? (
                      <EyeIcon
                        cursor="pointer"
                        fontSize="var(--icon-fontSize-md)"
                        onClick={() => setShowConfirmPassword(false)}
                        style={{ color: '#64748B' }}
                      />
                    ) : (
                      <EyeSlashIcon
                        cursor="pointer"
                        fontSize="var(--icon-fontSize-md)"
                        onClick={() => setShowConfirmPassword(true)}
                        style={{ color: '#64748B' }}
                      />
                    )
                  }
                  label="Confirmar Nova Senha" 
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6', borderWidth: '2px' }
                  }}
                />
                {errors.confirmPassword && <FormHelperText>{errors.confirmPassword}</FormHelperText>}
              </FormControl>
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mt: 2 }}>
            💡 A nova senha deve ter pelo menos 6 caracteres, incluindo letras e números.
          </Alert>
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          <Button 
            type="submit"
            variant="contained" 
            disabled={loading}
            sx={{
              bgcolor: '#3B82F6',
              '&:hover': { bgcolor: '#2563EB' },
              px: 3
            }}
          >
            {loading ? 'Alterando...' : 'Alterar Senha'}
          </Button>
        </CardActions>
      </Card>
    </form>
  );
}