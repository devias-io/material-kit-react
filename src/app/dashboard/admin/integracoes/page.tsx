'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Chip,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import { useRouter } from 'next/navigation';
import {
  PLATFORM_METADATA,
  PLATFORM_SLUGS,
  getIntegrationsByPlatform,
  type PlatformSlug
} from '@/data/integrations';

interface PlatformStats {
  name: string;
  slug: PlatformSlug;
  emoji: string;
  color: string;
  totalIntegrations: number;
  activeIntegrations: number;
  totalSales: number;
  status: 'active' | 'inactive' | 'coming-soon';
  description: string;
}

type RealStats = Partial<Record<PlatformSlug, {
  active: boolean;
  sales: number;
  integrations: number;
  tokens: string[];
}>>;

interface IntegrationSummaryResponse {
  id: string;
  productName: string;
  plan: string;
  status: 'ACTIVE' | 'INACTIVE';
  totalSales: number;
  webhookUrl: string;
  token?: string;
  productId?: string;
}

interface PlatformApiResponse {
  slug: PlatformSlug;
  name: string;
  emoji: string;
  color: string;
  description: string;
  status: 'active' | 'inactive' | 'coming-soon';
  integrations: IntegrationSummaryResponse[];
  totals: {
    totalIntegrations: number;
    activeIntegrations: number;
    totalSales: number;
  };
}

interface StatsApiResponse {
  success: boolean;
  platforms: PlatformApiResponse[];
  totals: {
    totalIntegrations: number;
    activeIntegrations: number;
    totalSales: number;
  };
}

export default function IntegracoesMainPage() {
  const router = useRouter();
  const [platforms, setPlatforms] = useState<PlatformStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [realStats, setRealStats] = useState<RealStats>({});

  const buildFallbackData = () => {
    const fallbackPlatforms: PlatformStats[] = [];
    const fallbackStats: RealStats = {};

    PLATFORM_SLUGS.forEach(slug => {
      const meta = PLATFORM_METADATA[slug];
      const integrations = getIntegrationsByPlatform(slug);
      const totalIntegrations = integrations.length;
      const activeIntegrations = integrations.filter(integration => integration.status === 'ACTIVE').length;
      const totalSales = integrations.reduce((sum, integration) => sum + integration.totalSales, 0);
      const tokens = integrations
        .map(integration => ('token' in integration ? integration.token : undefined))
        .filter((token): token is string => Boolean(token));

      const platformData: PlatformStats = {
        name: meta.name,
        slug,
        emoji: meta.emoji,
        color: meta.color,
        totalIntegrations,
        activeIntegrations,
        totalSales,
        status: activeIntegrations > 0 ? 'active' : meta.status,
        description: meta.description
      };

      fallbackPlatforms.push(platformData);
      fallbackStats[slug] = {
        active: activeIntegrations > 0,
        sales: totalSales,
        integrations: totalIntegrations,
        tokens
      };
    });

    return { platformStats: fallbackPlatforms, realStats: fallbackStats };
  };

  useEffect(() => {
    loadPlatformsStats();
  }, []);

  const loadPlatformsStats = async () => {
    try {
      setLoading(true);

      // ✅ BUSCAR DADOS REAIS DAS INTEGRAÇÕES
      console.log('🔍 Carregando stats reais das integrações...');

      const response = await fetch('/api/admin/integracoes/stats', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Falha ao carregar estatísticas (${response.status})`);
      }

      const data: StatsApiResponse = await response.json();
      console.log('✅ Stats reais carregadas:', data);

      const mappedPlatforms: PlatformStats[] = data.platforms.map(platform => ({
        name: platform.name,
        slug: platform.slug,
        emoji: platform.emoji,
        color: platform.color,
        totalIntegrations: platform.totals.totalIntegrations,
        activeIntegrations: platform.totals.activeIntegrations,
        totalSales: platform.totals.totalSales,
        status: platform.status,
        description: platform.description
      }));

      const statsMap: RealStats = data.platforms.reduce((acc, platform) => {
        acc[platform.slug] = {
          active: platform.totals.activeIntegrations > 0,
          sales: platform.totals.totalSales,
          integrations: platform.totals.totalIntegrations,
          tokens: platform.integrations
            .map(integration => integration.token)
            .filter((token): token is string => Boolean(token))
        };
        return acc;
      }, {} as RealStats);

      setPlatforms(mappedPlatforms);
      setRealStats(statsMap);

    } catch (error) {
      console.error('❌ Erro ao carregar stats das plataformas:', error);

      const fallback = buildFallbackData();
      setPlatforms(fallback.platformStats);
      setRealStats(fallback.realStats);
    } finally {
      setLoading(false);
    }
  };

  const handlePlatformClick = (slug: PlatformSlug) => {
    router.push(`/dashboard/admin/integracoes/${slug}`);
  };

  const getTotalStats = () => {
    return {
      totalIntegrations: platforms.reduce((sum, p) => sum + p.totalIntegrations, 0),
      totalActive: platforms.reduce((sum, p) => sum + p.activeIntegrations, 0),
      totalSales: platforms.reduce((sum, p) => sum + p.totalSales, 0)
    };
  };

  const stats = getTotalStats();
  const kiwifyTokens = realStats.kiwify?.tokens ?? [];
  const eduzzTokens = realStats.eduzz?.tokens ?? [];
  const kiwifyTokenLabel = kiwifyTokens.length > 0 ? kiwifyTokens.join(', ') : 'Nenhum token configurado';
  const eduzzTokenLabel = eduzzTokens.length > 0 ? eduzzTokens.join(', ') : 'Nenhum token configurado';

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ mb: 2 }} />
        <Typography>Carregando estatísticas das integrações...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <Box mb={5}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#1E293B', fontWeight: '700' }}>
          🔗 Central de Integrações
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748B' }}>
          Gerencie integrações com múltiplas plataformas de venda
        </Typography>
      </Box>

      {/* ✅ ALERTAS DE STATUS REAL */}
      {realStats.kiwify?.active && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: '500', mb: 1 }}>
            🥝 Kiwify Funcionando!
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
            Token(s) <strong>{kiwifyTokenLabel}</strong> ativo(s). {realStats.kiwify?.sales ?? 0} venda(s) processada(s) com sucesso.
          </Typography>
        </Alert>
      )}

      {realStats.eduzz?.active && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: '500', mb: 1 }}>
            📚 Eduzz Funcionando!
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
            Token(s) <strong>{eduzzTokenLabel}</strong> ativo(s). {realStats.eduzz?.sales ?? 0} venda(s) processada(s) com sucesso.
          </Typography>
        </Alert>
      )}

      {/* Espaçamento se houver alertas */}
      {(realStats.kiwify?.active || realStats.eduzz?.active) && <Box mb={2} />}

      {/* Stats Gerais */}
      <Grid container spacing={3} mb={5}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 3,
            border: stats.totalIntegrations > 0 ? '2px solid #4ECDC4' : '1px solid #E2E8F0'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: '#EFF6FF', color: '#3B82F6', mr: 2, fontSize: '20px' }}>
                  🔗
                </Avatar>
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Total de Integrações
                  </Typography>
                  <Typography variant="h4" sx={{ 
                    fontWeight: '700',
                    color: stats.totalIntegrations > 0 ? '#4ECDC4' : 'inherit'
                  }}>
                    {stats.totalIntegrations}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 3,
            border: stats.totalActive > 0 ? '2px solid #059669' : '1px solid #E2E8F0'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: '#F0FDF4', color: '#059669', mr: 2, fontSize: '20px' }}>
                  ✅
                </Avatar>
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Integrações Ativas
                  </Typography>
                  <Typography variant="h4" sx={{ 
                    fontWeight: '700',
                    color: stats.totalActive > 0 ? '#059669' : 'inherit'
                  }}>
                    {stats.totalActive}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: '#FFFBEB', color: '#D97706', mr: 2, fontSize: '20px' }}>
                  💰
                </Avatar>
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Total de Vendas
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: '700' }}>
                    {stats.totalSales}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: '#FAF5FF', color: '#7C3AED', mr: 2, fontSize: '20px' }}>
                  🏪
                </Avatar>
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Plataformas
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: '700' }}>
                    {platforms.filter(p => p.status === 'active').length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Informações sobre integrações */}
      <Alert severity="info" sx={{ mb: 4, borderRadius: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: '500', mb: 1 }}>
          💡 Como funcionam as integrações:
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
          Cada plataforma tem suas próprias integrações independentes. Configure webhooks específicos para cada produto e a venda será processada automaticamente, criando ou atualizando usuários no sistema.
        </Typography>
      </Alert>

      {/* Plataformas */}
      <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: '600', mb: 3 }}>
        Plataformas Disponíveis
      </Typography>

      <Grid container spacing={3}>
        {platforms.map((platform) => (
          <Grid item xs={12} sm={6} md={4} key={platform.slug}>
            <Card 
              sx={{ 
                borderRadius: 3,
                cursor: platform.status === 'active' ? 'pointer' : 'default',
                transition: 'all 0.2s ease-in-out',
                border: (platform.slug === 'kiwify' && platform.activeIntegrations > 0) ||
                        (platform.slug === 'eduzz' && platform.activeIntegrations > 0)
                  ? `2px solid ${platform.color}` 
                  : '1px solid #E2E8F0',
                '&:hover': platform.status === 'active' ? {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px 0 rgba(0, 0, 0, 0.15)'
                } : {},
                opacity: platform.status === 'coming-soon' ? 0.6 : 1
              }}
              onClick={() => platform.status === 'active' && handlePlatformClick(platform.slug)}
            >
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" alignItems="center" mb={3}>
                  <Avatar 
                    sx={{ 
                      bgcolor: `${platform.color}20`, 
                      color: platform.color, 
                      mr: 2, 
                      fontSize: '24px',
                      width: 56,
                      height: 56
                    }}
                  >
                    {platform.emoji}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: '600', color: '#1E293B' }}>
                      {platform.name}
                      {/* Badge para plataformas funcionando */}
                      {((platform.slug === 'kiwify' && platform.activeIntegrations > 0) ||
                        (platform.slug === 'eduzz' && platform.activeIntegrations > 0)) && (
                        <Chip 
                          label="FUNCIONANDO" 
                          size="small" 
                          sx={{ 
                            ml: 1, 
                            bgcolor: platform.color, 
                            color: 'white', 
                            fontWeight: '700',
                            fontSize: '10px'
                          }} 
                        />
                      )}
                    </Typography>
                    <Chip
                      label={
                        platform.status === 'active' ? 
                          (platform.activeIntegrations > 0 ? 'Ativa ✅' : 'Disponível') :
                        platform.status === 'inactive' ? 'Inativo' : 'Em Breve'
                      }
                      size="small"
                      color={
                        platform.status === 'active' ? 
                          (platform.activeIntegrations > 0 ? 'success' : 'primary') :
                        platform.status === 'inactive' ? 'error' : 'default'
                      }
                      sx={{ fontWeight: '500' }}
                    />
                  </Box>
                </Box>

                <Typography variant="body2" sx={{ color: '#64748B', mb: 3, lineHeight: 1.6 }}>
                  {platform.description}
                </Typography>

                <Grid container spacing={2} mb={3}>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h6" sx={{ 
                        fontWeight: '700', 
                        color: platform.totalIntegrations > 0 ? platform.color : '#94A3B8'
                      }}>
                        {platform.totalIntegrations}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Total
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h6" sx={{ 
                        fontWeight: '700', 
                        color: platform.activeIntegrations > 0 ? '#059669' : '#94A3B8'
                      }}>
                        {platform.activeIntegrations}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Ativas
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h6" sx={{ 
                        fontWeight: '700', 
                        color: platform.totalSales > 0 ? '#D97706' : '#94A3B8'
                      }}>
                        {platform.totalSales}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Vendas
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Button
                  variant={platform.status === 'active' ? 'contained' : 'outlined'}
                  fullWidth
                  disabled={platform.status !== 'active'}
                  sx={{ 
                    bgcolor: platform.status === 'active' ? platform.color : 'transparent',
                    borderColor: platform.color,
                    color: platform.status === 'active' ? '#FFFFFF' : platform.color,
                    '&:hover': platform.status === 'active' ? {
                      bgcolor: platform.color,
                      opacity: 0.9
                    } : {},
                    textTransform: 'none',
                    fontWeight: '600'
                  }}
                  onClick={() => platform.status === 'active' && handlePlatformClick(platform.slug)}
                >
                  {platform.status === 'active' ? 
                    (platform.activeIntegrations > 0 ? 'Gerenciar Integrações ✅' : 'Configurar Integrações') :
                   platform.status === 'inactive' ? 'Indisponível' : 'Em Breve'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Rodapé informativo */}
      <Box mt={6} p={4} sx={{ backgroundColor: '#F1F5F9', borderRadius: 3 }}>
        <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: '600', mb: 2 }}>
          🚀 Próximas Funcionalidades
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              • Sincronização automática de produtos
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              • Relatórios unificados de vendas
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              • Gestão de afiliados integrada
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              • Webhooks com retry automático ✅
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}