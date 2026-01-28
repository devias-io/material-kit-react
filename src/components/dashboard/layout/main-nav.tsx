// src/components/dashboard/layout/main-nav.tsx
'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Typography from '@mui/material/Typography';
import { Bell as BellIcon } from '@phosphor-icons/react/dist/ssr/Bell';
import { List as ListIcon } from '@phosphor-icons/react/dist/ssr/List';
import { MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { usePopover } from '@/hooks/use-popover';
import { useUser } from '@/hooks/use-user';
import { useDataStore } from '@/hooks/useDataStore';
import { useNotifications } from '@/hooks/useNotifications';
import { MobileNav } from './mobile-nav';
import { UserPopover } from './user-popover';
import { NotificationPopover } from '@/components/core/notification-popover';

// Hook para buscar ativos
function useAtivos(
  dados: Record<string, any[]>,
  CARTEIRAS_CONFIG: Record<string, { nome: string; icon: string; color: string; moeda: string }>,
  isInitialized: boolean
) {
  const [ativos, setAtivos] = React.useState([]);

  React.useEffect(() => {
    if (!isInitialized) return;

    try {
      const todosAtivos = [];
      
      Object.entries(dados).forEach(([nomeCarteira, ativosCarteira]) => {
        const configCarteira = CARTEIRAS_CONFIG[nomeCarteira];
        
        if (!configCarteira || !Array.isArray(ativosCarteira)) return;
        
        ativosCarteira.forEach(ativo => {
          todosAtivos.push({
            ticker: ativo.ticker,
            nome: ativo.nome || ativo.ticker,
            setor: ativo.setor || 'Outros',
            carteira: configCarteira.nome,
            carteiraIcon: configCarteira.icon,
            carteiraColor: configCarteira.color,
            moeda: configCarteira.moeda,
            dataEntrada: ativo.dataEntrada,
            precoEntrada: ativo.precoEntrada,
            precoTeto: ativo.precoTeto,
            precoTetoBDR: ativo.precoTetoBDR,
            fonte: 'datastore',
            id: ativo.id
          });
        });
      });

      const ativosUnicos = todosAtivos.reduce((acc, ativo) => {
        const existing = acc.find(a => a.ticker === ativo.ticker);
        if (!existing) {
          acc.push(ativo);
        } else {
          if (ativo.nome && ativo.nome !== ativo.ticker && (!existing.nome || existing.nome === existing.ticker)) {
            existing.nome = ativo.nome;
          }
        }
        return acc;
      }, []);

      ativosUnicos.sort((a, b) => a.ticker.localeCompare(b.ticker));
      setAtivos(ativosUnicos);

    } catch (error) {
      console.error('❌ Erro ao carregar ativos do DataStore:', error);
      setAtivos([]);
    }
  }, [dados, CARTEIRAS_CONFIG, isInitialized]);

  return ativos;
}

export function MainNav(): React.JSX.Element {
  const [openNav, setOpenNav] = React.useState<boolean>(false);
  const [searchMode, setSearchMode] = React.useState<boolean>(false);
  const userPopover = usePopover<HTMLDivElement>();
  const notificationPopover = usePopover<HTMLButtonElement>();
  const router = useRouter();
  const { user } = useUser(); // ← ADICIONE ESTA LINHA
  
  const [userAvatar, setUserAvatar] = React.useState<string>('/assets/avatar.png');
  const avatarRef = React.useRef(userAvatar);
  React.useEffect(() => {
    avatarRef.current = userAvatar;
  }, [userAvatar]);
  
  const { dados, CARTEIRAS_CONFIG, isInitialized, initializeData } = useDataStore({ autoLoad: false });
  const ativos = useAtivos(dados, CARTEIRAS_CONFIG, isInitialized);
  const { notifications, unreadCount } = useNotifications();

  // Atualiza avatar quando o usuário do contexto muda
  React.useEffect(() => {
    try {
      if (user?.avatar) {
        setUserAvatar(user.avatar);
      } else {
        const userData = localStorage.getItem('user-data');
        if (userData) {
          const parsed = JSON.parse(userData);
          if (parsed.avatar) {
            setUserAvatar(parsed.avatar);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar avatar:', error);
    }
  }, [user]);

  React.useEffect(() => {
    if (searchMode && !isInitialized) {
      initializeData();
    }
  }, [initializeData, isInitialized, searchMode]);

  const handleAtivoSelect = (ativo) => {
    if (ativo) {
      router.push(`/dashboard/ativo/${ativo.ticker}`);
      setSearchMode(false);
    }
  };

  const filterOptions = (options, { inputValue }) => {
    if (!inputValue) return [];
    
    const searchTerm = inputValue.toLowerCase();
    
    return options.filter(ativo => 
      ativo.ticker.toLowerCase().includes(searchTerm) ||
      ativo.nome.toLowerCase().includes(searchTerm) ||
      ativo.setor.toLowerCase().includes(searchTerm) ||
      (ativo.carteira && ativo.carteira.toLowerCase().includes(searchTerm))
    ).slice(0, 12);
  };

  return (
    <React.Fragment>
      <Box
        component="header"
        sx={{
          borderBottom: '1px solid var(--mui-palette-divider)',
          backgroundColor: 'var(--mui-palette-background-paper)',
          position: 'sticky',
          top: 0,
          zIndex: 'var(--mui-zIndex-appBar)',
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: 'center', justifyContent: 'space-between', minHeight: '64px', px: 2 }}
        >
          <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
            <IconButton
              onClick={(): void => {
                setOpenNav(true);
              }}
              sx={{ display: { lg: 'none' } }}
            >
              <ListIcon />
            </IconButton>
            
            {searchMode ? (
              <Box sx={{ minWidth: 350, maxWidth: 500 }}>
                <Autocomplete
                  options={ativos}
                  getOptionLabel={(option) => `${option.ticker} - ${option.nome}`}
                  filterOptions={filterOptions}
                  onChange={(event, value) => handleAtivoSelect(value)}
                  onClose={() => setSearchMode(false)}
                  open={true}
                  clearOnEscape
                  blurOnSelect
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={`Buscar entre ${ativos.length} ativos (ex: PETR4, Vale, Tecnologia...)`}
                      variant="outlined"
                      size="small"
                      autoFocus
                      onBlur={() => {
                        setTimeout(() => setSearchMode(false), 150);
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          fontSize: '14px',
                          backgroundColor: 'white',
                          '& fieldset': {
                            borderColor: '#010101',
                          },
                          '&:hover fieldset': {
                            borderColor: '#010101',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#010101',
                          },
                        }
                      }}
                    />
                  )}
renderOption={(props, option) => (
  <Box
    component="li"
    {...props}
    sx={{
      px: 1.5,
      py: 1,
      borderRadius: 1,
      transition: 'background-color 0.2s ease',
      '&:hover': {
        bgcolor: 'action.hover',
      },
    }}
  >
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '100%' }}>
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: 600, minWidth: 70 }}
      >
        {option.ticker}
      </Typography>
      <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary" noWrap>
          {option.nome}
        </Typography>
        <Typography variant="caption" color="text.disabled" noWrap>
          {option.carteira} • {option.setor}
        </Typography>
      </Stack>
    </Stack>
  </Box>
                  )}
                  noOptionsText={`Nenhum ativo encontrado entre ${ativos.length} disponíveis`}
                />
              </Box>
            ) : (
              <Tooltip title={`Buscar entre ${ativos.length} ativos`}>
                <IconButton onClick={() => setSearchMode(true)}>
                  <MagnifyingGlassIcon />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
          
          <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
            {/* NOTIFICAÇÕES INTEGRADAS */}
            <Tooltip title="Notificações">
              <IconButton
                ref={notificationPopover.anchorRef}
                onClick={notificationPopover.handleOpen}
              >
                <Badge 
                  badgeContent={unreadCount} 
                  color="error" 
                  variant={unreadCount > 0 ? "standard" : "dot"}
                  invisible={unreadCount === 0}
                  max={99}
                >
                  <BellIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            <Avatar
              onClick={userPopover.handleOpen}
              ref={userPopover.anchorRef}
              src={userAvatar && userAvatar !== '/assets/avatar.png' ? userAvatar : undefined}
              sx={{ 
                cursor: 'pointer',
                border: '2px solid #E2E8F0',
                width: 40,
                height: 40,
                '&:hover': {
                  border: '2px solid #3B82F6'
                }
              }}            
            />
          </Stack>
        </Stack>
      </Box>

      {/* POPOVERS */}
      <UserPopover 
        anchorEl={userPopover.anchorRef.current} 
        onClose={userPopover.handleClose} 
        open={userPopover.open} 
      />
      
<NotificationPopover
  anchorEl={notificationPopover.anchorRef.current}
  onClose={notificationPopover.handleClose}
  open={notificationPopover.open}
  notifications={notifications}
  unreadCount={unreadCount}
/>      
      <MobileNav
        onClose={() => {
          setOpenNav(false);
        }}
        open={openNav}
      />
    </React.Fragment>
  );
}
