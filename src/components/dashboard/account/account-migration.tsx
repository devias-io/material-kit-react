'use client';

import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  ArrowDownward as ArrowDownIcon,
} from '@mui/icons-material';

type MigrationSimulation = {
  fromPlan: string;
  toPlan: string;
  totalPaid: number;
  installmentsTotal: number | null;
  installmentsPaid: number | null;
  platform: string | null;
  productExternalId: string | null;
  productName: string | null;
  monthsRemaining: number;
  monthsUsed: number;
  monthlyValue: number;
  credit: number;
  vipPrice: number;
  finalPrice: number;
  notices: string[];
  purchaseDate: string;
  expirationDate: string | null;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const VIP_BENEFITS = [
  {
    icon: <TrendingUpIcon sx={{ fontSize: 24, color: '#10B981' }} />,
    title: 'Análise de Carteira Personalizada',
    description: 'Análise completa para novos membros',
  },
  {
    icon: <TrophyIcon sx={{ fontSize: 24, color: '#F59E0B' }} />,
    title: 'Ações Microcaps',
    description: 'Empresas com grande potencial de multiplicação',
  },
  {
    icon: <StarIcon sx={{ fontSize: 24, color: '#3B82F6' }} />,
    title: 'Ativos no Exterior Completo',
    description: 'ETF/Stock/Reits - Dividendos em Dólar',
  },
  {
    icon: <CheckCircleIcon sx={{ fontSize: 24, color: '#8B5CF6' }} />,
    title: 'Ações Small Caps e Dividendos',
    description: 'Carteiras de ações recomendadas',
  },
  {
    icon: <TrophyIcon sx={{ fontSize: 24, color: '#EF4444' }} />,
    title: 'Fundos Imobiliários',
    description: 'Renda passiva mensal, Isenta de IR',
  },
  {
    icon: <CheckCircleIcon sx={{ fontSize: 24, color: '#06B6D4' }} />,
    title: 'Curso de Imposto de Renda',
    description: 'Curso completo para declaração',
  },
  {
    icon: <StarIcon sx={{ fontSize: 24, color: '#F59E0B' }} />,
    title: 'Network e Mentorias',
    description: 'Grupo exclusivo + Mentorias gravadas',
  },
  {
    icon: <TrendingUpIcon sx={{ fontSize: 24, color: '#10B981' }} />,
    title: 'Atualizações e Conteúdo Extra',
    description: 'Telegram, Instagram stories e Renda Extra com Milhas',
  },
];

export function AccountMigration(): React.JSX.Element {
  const [simulation, setSimulation] = React.useState<MigrationSimulation | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [linkLoading, setLinkLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSimulate = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/account/migration-simulation?target=VIP', {
        method: 'GET',
        credentials: 'include',
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Não foi possível simular a migração.');
      }

      setSimulation(payload.simulation);
    } catch (err) {
      setSimulation(null);
      setError(err instanceof Error ? err.message : 'Erro ao simular migração.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLink = async () => {
    try {
      setLinkLoading(true);
      setError(null);

      const response = await fetch('/api/account/migration-link', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'VIP' }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Não foi possível gerar o link de pagamento.');
      }

      if (payload?.paymentUrl) {
        window.location.href = payload.paymentUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar o link de pagamento.');
    } finally {
      setLinkLoading(false);
    }
  };

  return (
    <Card
      sx={{
        backgroundColor: '#FFFFFF',
        borderRadius: 3,
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        overflow: 'visible',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Header com badge VIP */}
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="h5" sx={{ color: '#1E293B', fontWeight: 700 }}>
                👑 Upgrade para VIP
              </Typography>
              <Chip
                label="PREMIUM"
                size="small"
                sx={{
                  bgcolor: '#F59E0B',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                }}
              />
            </Stack>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              Desbloqueie todos os recursos e eleve seus investimentos ao próximo nível
            </Typography>
          </Box>

          {/* Seção de Benefícios - SEMPRE VISÍVEL */}
          <Box
            sx={{
              bgcolor: '#EFF6FF',
              borderRadius: 2,
              p: 3,
              border: '2px solid #BFDBFE',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <StarIcon sx={{ color: '#F59E0B', fontSize: 28 }} />
              <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: 600 }}>
                O que você ganha com o VIP
              </Typography>
            </Stack>

            <Grid container spacing={2}>
              {VIP_BENEFITS.map((benefit, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1.5,
                      p: 2,
                      bgcolor: '#FFFFFF',
                      borderRadius: 2,
                      border: '1px solid #E2E8F0',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      },
                    }}
                  >
                    <Box sx={{ flexShrink: 0, mt: 0.5 }}>{benefit.icon}</Box>
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ color: '#1E293B', fontWeight: 600, mb: 0.5 }}
                      >
                        {benefit.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.875rem' }}>
                        {benefit.description}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>

          {error && (
            <Alert severity="warning" sx={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
              {error}
            </Alert>
          )}

          {!simulation && (
            <Button
              variant="contained"
              size="large"
              onClick={handleSimulate}
              disabled={loading}
              sx={{
                bgcolor: '#3B82F6',
                color: '#FFFFFF',
                fontWeight: 600,
                py: 1.5,
                fontSize: '1rem',
                '&:hover': { bgcolor: '#2563EB' },
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              }}
            >
              {loading ? 'Calculando...' : '🚀 Ver condições especiais de upgrade'}
            </Button>
          )}

          {simulation && (
            <Stack spacing={3}>
              <Divider />

              {/* Resumo do Plano Atual */}
              <Box>
                <Typography variant="subtitle1" sx={{ color: '#1E293B', fontWeight: 600, mb: 2 }}>
                  📊 Seu plano atual
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                        Plano
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#1E293B', fontWeight: 600 }}>
                        {simulation.fromPlan}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                        Última compra
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#1E293B', fontWeight: 600 }}>
                        {new Date(simulation.purchaseDate).toLocaleDateString('pt-BR')}
                      </Typography>
                    </Box>
                  </Grid>
                  {simulation.productName && (
                    <Grid item xs={12}>
                      <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                          Produto
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#1E293B', fontWeight: 600 }}>
                          {simulation.productName}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                        Meses usados
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#1E293B', fontWeight: 600 }}>
                        {simulation.monthsUsed}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                        Meses restantes
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#10B981', fontWeight: 600 }}>
                        {simulation.monthsRemaining}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                        Total pago
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#1E293B', fontWeight: 600 }}>
                        {formatCurrency(simulation.totalPaid)}
                      </Typography>
                    </Box>
                  </Grid>
                  {simulation.installmentsTotal && (
                    <Grid item xs={6}>
                      <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                          Parcelas contratadas
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#1E293B', fontWeight: 600 }}>
                          {simulation.installmentsTotal}x
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                  {simulation.installmentsPaid !== null && (
                    <Grid item xs={6}>
                      <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                          Parcelas pagas
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#1E293B', fontWeight: 600 }}>
                          {simulation.installmentsPaid}x
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Box>

              <Divider />

              {/* VALOR FINAL EM DESTAQUE - NOVO LAYOUT */}
              <Box>
                <Typography variant="subtitle1" sx={{ color: '#1E293B', fontWeight: 600, mb: 3 }}>
                  💰 Investimento do upgrade
                </Typography>

                {/* Cálculo visual com setas */}
                <Stack spacing={2}>
                  {/* Valor do VIP */}
                  <Box
                    sx={{
                      p: 2.5,
                      bgcolor: '#F8FAFC',
                      borderRadius: 2,
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body1" sx={{ color: '#475569', fontSize: '0.95rem' }}>
                        Plano VIP anual
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: 600 }}>
                        {formatCurrency(simulation.vipPrice)}
                      </Typography>
                    </Stack>
                  </Box>

                  {/* Seta para baixo */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 0.5 }}>
                    <ArrowDownIcon sx={{ color: '#10B981', fontSize: 32 }} />
                  </Box>

                  {/* Crédito aplicado - MENOR */}
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: '#D1FAE5',
                      borderRadius: 2,
                      border: '1px solid #6EE7B7',
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body2" sx={{ color: '#065F46', fontWeight: 500 }}>
                          Desconto do seu tempo restante
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#047857' }}>
                          {simulation.monthsRemaining} meses × {formatCurrency(simulation.monthlyValue)}
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ color: '#047857', fontWeight: 600 }}>
                        - {formatCurrency(simulation.credit)}
                      </Typography>
                    </Stack>
                  </Box>

                  {/* Linha divisória */}
                  <Divider sx={{ my: 1 }} />

                  {/* VALOR FINAL - GIGANTE E DESTACADO */}
                  <Box
                    sx={{
                      p: 4,
                      bgcolor: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                      borderRadius: 3,
                      boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
                      textAlign: 'center',
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#BFDBFE', 
                        fontWeight: 500,
                        mb: 1,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      Você vai pagar
                    </Typography>
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        color: '#FFFFFF', 
                        fontWeight: 800,
                        fontSize: { xs: '2.5rem', sm: '3rem' },
                        mb: 0.5
                      }}
                    >
                      {formatCurrency(simulation.finalPrice)}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: '#DBEAFE',
                        fontSize: '0.875rem'
                      }}
                    >
                      À vista ou parcelado em até 12x
                    </Typography>
                  </Box>

                  {/* Badge de economia */}
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: '#FEF3C7',
                      borderRadius: 2,
                      border: '1px solid #FDE68A',
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#92400E' }}>
                      🎉 Você economiza <strong>{formatCurrency(simulation.credit)}</strong> aproveitando seu tempo restante!
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              {/* Avisos importantes */}
              {simulation.notices.length > 0 && (
                <Stack spacing={1}>
                  {simulation.notices.map((notice) => (
                    <Alert
                      key={notice}
                      severity="info"
                      sx={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}
                    >
                      {notice}
                    </Alert>
                  ))}
                </Stack>
              )}

              {/* Botões de ação */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="outlined"
                  onClick={handleSimulate}
                  disabled={loading}
                  sx={{
                    textTransform: 'none',
                    borderColor: '#CBD5E1',
                    color: '#475569',
                    '&:hover': {
                      borderColor: '#94A3B8',
                      bgcolor: '#F8FAFC',
                    },
                  }}
                >
                  🔄 Recalcular
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleGenerateLink}
                  disabled={linkLoading}
                  sx={{
                    flex: 1,
                    bgcolor: '#10B981',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    py: 1.5,
                    fontSize: '1rem',
                    '&:hover': { bgcolor: '#059669' },
                    textTransform: 'none',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  {linkLoading ? 'Gerando link...' : '✨ Fazer upgrade agora'}
                </Button>
              </Stack>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
