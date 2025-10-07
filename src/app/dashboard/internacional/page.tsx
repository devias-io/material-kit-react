/* eslint-disable @typescript-eslint/explicit-function-return-type */
'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { ArrowLeft as ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr/ArrowLeft';
import { ChartLine as ChartLineIcon } from '@phosphor-icons/react/dist/ssr/ChartLine';
import { TrendUp as TrendUpIcon } from '@phosphor-icons/react/dist/ssr/TrendUp';
import { CurrencyDollar as CurrencyDollarIcon } from '@phosphor-icons/react/dist/ssr/CurrencyDollar';
import { Star as StarIcon } from '@phosphor-icons/react/dist/ssr/Star';
import { useAuthAccess } from '@/hooks/use-auth-access';

// 🎨 CARD DE NAVEGAÇÃO MODERNO
interface NavigationCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  isNew?: boolean;
}

interface NavigationCardConfig extends NavigationCardProps {
  permission: string;
}

function NavigationCard({ title, description, icon, href, isNew = false }: NavigationCardProps): React.JSX.Element {
  const handleNavigation = () => {
    window.location.href = href;
  };

  return (
    <Card
      onClick={handleNavigation}
      sx={{
        position: 'relative',
        height: '280px',
        borderRadius: 3,
        overflow: 'hidden',
        cursor: 'pointer',
        background: 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
        border: '1px solid #333333',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.4)',
          border: '1px solid #444444',
          '& .main-title': {
            color: '#00ff41',
          },
          '& .icon-container': {
            backgroundColor: 'rgba(0, 255, 65, 0.1)',
            border: '1px solid rgba(0, 255, 65, 0.3)',
          },
          '& .planilha-badge': {
            backgroundColor: '#ffffff',
            color: '#000000',
          }
        },
      }}
    >
      {/* Badge "NOVO" se aplicável */}
      {isNew && (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'linear-gradient(135deg, #00ff41 0%, #00cc33 100%)',
            borderRadius: '20px',
            px: 2,
            py: 0.75,
            zIndex: 3,
            boxShadow: '0 4px 12px rgba(0, 255, 65, 0.4)',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: '#000000',
              fontWeight: 700,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}
          >
            🇺🇸 NOVO
          </Typography>
        </Box>
      )}

      {/* Linha verde no topo */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '3px',
          background: 'linear-gradient(90deg, transparent 0%, #00ff41 50%, transparent 100%)'
        }}
      />
      
      {/* Content */}
      <Box
        sx={{
          p: 4,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
          zIndex: 2,
          pt: 4 // Reduzido de 8 para 4
        }}
      >
        {/* Ícone */}
        <Box
          className="icon-container"
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            transition: 'all 0.3s ease',
            mb: 3
          }}
        >
          {React.cloneElement(icon as React.ReactElement, { size: 36, weight: 'bold' })}
        </Box>
        
        {/* Título principal em verde */}
        <Typography
          className="main-title"
          variant="h4"
          sx={{
            fontWeight: 700,
            color: '#ffffff',
            fontSize: '1.75rem',
            lineHeight: 1.2,
            mb: 2,
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            transition: 'color 0.3s ease'
          }}
        >
          {title}
        </Typography>
        
        {/* Descrição */}
        <Typography
          variant="body2"
          sx={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '0.85rem',
            lineHeight: 1.4,
            fontWeight: 400,
            maxWidth: '200px'
          }}
        >
          {description}
        </Typography>
      </Box>

      {/* Elementos decorativos de fundo */}
      <Box
        sx={{
          position: 'absolute',
          bottom: -20,
          right: -20,
          width: '80px',
          height: '80px',
          background: 'radial-gradient(circle, rgba(0,255,65,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          opacity: 0.5
        }}
      />
      
      <Box
        sx={{
          position: 'absolute',
          top: -30,
          left: -30,
          width: '100px',
          height: '100px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%)',
          borderRadius: '50%',
          opacity: 0.8
        }}
      />
    </Card>
  );
}

export default function Page(): React.JSX.Element {
  const { hasAccessSync, loading } = useAuthAccess();

  const navigationCards: NavigationCardConfig[] = [
    {
      title: 'ETFs',
      description: 'Fundos diversificados para exposição global',
      icon: <ChartLineIcon />,
      href: '/dashboard/internacional/etfs',
      permission: 'internacional-etfs'
    },
    {
      title: 'Stocks',
      description: 'Ações individuais de empresas globais',
      icon: <TrendUpIcon />,
      href: '/dashboard/internacional/stocks',
      permission: 'internacional-stocks'
    },
    {
      title: 'Dividendos',
      description: 'Ativos focados em renda passiva',
      icon: <CurrencyDollarIcon />,
      href: '/dashboard/internacional/dividendos',
      permission: 'internacional-dividendos'
    },
    // 🇺🇸 NOVO CARD - Projeto América
    {
      title: 'Projeto América',
      description: 'Investimentos estratégicos no mercado americano',
      icon: <StarIcon />,
      href: '/dashboard/internacional/projeto-america',
      isNew: true,
      permission: 'internacional-projeto-america'
    }
  ];

  const accessibleCards = navigationCards.filter(card => hasAccessSync(card.permission));

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        p: 3 
      }}
    >
      {/* Header */}
      <Stack spacing={3} sx={{ mb: 6 }}>
        <Button
          startIcon={<ArrowLeftIcon />}
          onClick={() => window.location.href = '/dashboard'}
          sx={{ 
            color: '#64748b',
            fontWeight: 600,
            alignSelf: 'flex-start',
            '&:hover': {
              backgroundColor: '#f1f5f9'
            }
          }}
        >
          Dashboard
        </Button>
        <Stack spacing={0.5}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 800,
              color: '#1e293b',
              fontSize: { xs: '2rem', sm: '2.5rem' }
            }}
          >
            Internacional
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#64748b',
              fontSize: '1rem'
            }}
          >
            Escolha sua carteira de investimentos
          </Typography>
        </Stack>
      </Stack>

      {/* Navigation Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' },
          gap: 4,
          maxWidth: '1400px',
          mx: 'auto'
        }}
      >
        {accessibleCards.map((card, index) => (
          <NavigationCard key={index} {...card} />
        ))}
      </Box>

      {!loading && accessibleCards.length === 0 && (
        <Box
          sx={{
            mt: 6,
            p: 4,
            borderRadius: 3,
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            maxWidth: '720px',
            mx: 'auto',
            textAlign: 'center'
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: '#1e293b',
              mb: 1
            }}
          >
            Seu plano não inclui carteiras internacionais
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#64748b'
            }}
          >
            Entre em contato com nosso suporte para saber mais sobre os planos que oferecem acesso às carteiras internacionais.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
