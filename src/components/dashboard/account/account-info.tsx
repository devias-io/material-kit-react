'use client';

import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import { useUser } from '@/hooks/use-user';
import { useAuthAccess } from '@/hooks/use-auth-access';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const PLAN_STYLE_MAP = {
  VIP: { color: '#8B5CF6', emoji: '👑' },
  LITE: { color: '#3B82F6', emoji: '⭐' },
  LITE_V2: { color: '#2563EB', emoji: '⭐' },
  RENDA_PASSIVA: { color: '#10B981', emoji: '💰' },
  FIIS: { color: '#F59E0B', emoji: '🏢' },
  AMERICA: { color: '#EF4444', emoji: '🇺🇸' },
  ADMIN: { color: '#6B7280', emoji: '🛡️' }
} as const;

const DEFAULT_PLAN_STYLE = { color: '#9CA3AF', emoji: '📋' };

export function AccountInfo(): React.JSX.Element {
  const { user, refreshProfile } = useUser();
  const { planInfo: accessPlanInfo } = useAuthAccess();
  const [uploading, setUploading] = React.useState(false);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Arquivo muito grande. Máximo 5MB');
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const avatarData = e.target?.result as string;
        
        // Atualizar no servidor
        const response = await fetch('/api/user/profile', {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            firstName: user?.firstName,
            lastName: user?.lastName,
            avatar: avatarData
          })
        });

        if (response.ok) {
          await refreshProfile?.();
        } else {
          alert('Erro ao fazer upload da foto');
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao fazer upload da foto');
    } finally {
      setUploading(false);
    }
  };

  const planKey = user?.plan as keyof typeof PLAN_STYLE_MAP | undefined;
  const planInfo = React.useMemo(() => {
    const style = planKey ? PLAN_STYLE_MAP[planKey] : DEFAULT_PLAN_STYLE;

    return {
      label: accessPlanInfo.displayName,
      color: style.color,
      emoji: style.emoji,
    };
  }, [accessPlanInfo.displayName, planKey]);

  return (
    <Card sx={{ 
      backgroundColor: '#FFFFFF', 
      borderRadius: 3, 
      border: '1px solid #E2E8F0',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2} sx={{ alignItems: 'center' }}>
          <div>
<Avatar 
  src={user?.avatar ? user.avatar : undefined}
  sx={{ 
    height: '80px', 
    width: '80px',
    border: '3px solid #E2E8F0'
  }} 
/>
          </div>
          <Stack spacing={1} sx={{ textAlign: 'center' }}>
            <Typography variant="h5" sx={{ color: '#1E293B', fontWeight: '600' }}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography color="text.secondary" variant="body2" sx={{ color: '#64748B' }}>
              {user?.email}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
              <span style={{ fontSize: '16px' }}>{planInfo.emoji}</span>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: planInfo.color,
                  fontWeight: '500'
                }}
              >
                {planInfo.label}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
      <Divider />
      <CardActions sx={{ p: 2 }}>
        <Button 
          component="label" 
          fullWidth 
          variant="text"
          disabled={uploading}
          sx={{
            color: '#3B82F6',
            '&:hover': { backgroundColor: '#EFF6FF' }
          }}
        >
          {uploading ? '📤 Enviando...' : '📷 Alterar Foto'}
          <VisuallyHiddenInput
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
          />
        </Button>
      </CardActions>
    </Card>
  );
}