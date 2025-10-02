'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import { SignOut as SignOutIcon } from '@phosphor-icons/react/dist/ssr/SignOut';
import { User as UserIcon } from '@phosphor-icons/react/dist/ssr/User';
import { paths } from '@/paths';
import { authClient } from '@/lib/auth/client';
import { logger } from '@/lib/default-logger';
import { useUser } from '@/hooks/use-user';

export interface UserPopoverProps {
  anchorEl: Element | null;
  onClose: () => void;
  open: boolean;
}

export function UserPopover({ anchorEl, onClose, open }: UserPopoverProps): React.JSX.Element {
  const { checkSession } = useUser();
  const router = useRouter();
  
  const [userData, setUserData] = React.useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    avatar?: string;
  } | null>(null);

  // Carregar dados do usuário quando o popover abrir
  React.useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: user } = await authClient.getUser();
        if (user) {
          setUserData(prev => ({ ...(prev ?? {}), ...(user || {}) }));
          
          // Verificar se há dados no localStorage
          const userDataFromStorage = localStorage.getItem('user-data');
          if (userDataFromStorage) {
            try {
              const parsedUser = JSON.parse(userDataFromStorage);
              if (parsedUser.avatar) {
                setUserData(prev => ({ ...prev, avatar: parsedUser.avatar }));
              }
            } catch (error) {
              console.error('Error parsing user data from storage:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    if (open) {
      loadUserData();
    }
  }, [open]);

  // Escutar mudanças no localStorage
  React.useEffect(() => {
    const handleStorageChange = () => {
      if (open) {
        const userDataFromStorage = localStorage.getItem('user-data');
        if (userDataFromStorage) {
          try {
            const parsedUser = JSON.parse(userDataFromStorage);
            const filteredUser = Object.fromEntries(
              Object.entries(parsedUser).filter(([, v]) => v != null)
            );
            setUserData(prev => ({ ...(prev ?? {}), ...filteredUser }));
          } catch (error) {
            console.error('Error parsing user data from storage:', error);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    if (open) {
      handleStorageChange();
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [open]);

  const handleSignOut = React.useCallback(async (): Promise<void> => {
    try {
      const { error } = await authClient.signOut();
      if (error) {
        logger.error('Sign out error', error);
        return;
      }
      await checkSession?.();
      router.refresh();
    } catch (err) {
      logger.error('Sign out error', err);
    }
  }, [checkSession, router]);

  const displayName = userData 
    ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
    : 'Carregando...';
  
  const displayEmail = userData?.email || 'carregando...';
const avatarSrc = userData?.avatar || undefined;

  return (
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      onClose={onClose}
      open={open}
      slotProps={{ paper: { sx: { width: '240px' } } }}
    >
      <Box sx={{ p: '16px 20px' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar 
            src={avatarSrc}
            sx={{ 
              width: 40, 
              height: 40,
              border: '2px solid #E2E8F0'
            }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: '600',
                color: '#1E293B',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {displayName}
            </Typography>
            <Typography 
              color="text.secondary" 
              variant="body2"
              sx={{
                color: '#64748B',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {displayEmail}
            </Typography>
          </Box>
        </Stack>
      </Box>
      <Divider />
      <MenuList disablePadding sx={{ p: '8px', '& .MuiMenuItem-root': { borderRadius: 1 } }}>
        <MenuItem component={RouterLink} href={paths.dashboard.account} onClick={onClose}>
          <ListItemIcon>
            <UserIcon fontSize="var(--icon-fontSize-md)" />
          </ListItemIcon>
          Minha Conta
        </MenuItem>
        <MenuItem onClick={handleSignOut}>
          <ListItemIcon>
            <SignOutIcon fontSize="var(--icon-fontSize-md)" />
          </ListItemIcon>
          Sair
        </MenuItem>
      </MenuList>
    </Popover>
  );
}
