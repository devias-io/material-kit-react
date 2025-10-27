'use client';

import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { ArrowUp as ArrowUpIcon } from '@phosphor-icons/react/dist/ssr/ArrowUp';
import { ArrowDown as ArrowDownIcon } from '@phosphor-icons/react/dist/ssr/ArrowDown';
import { CurrencyDollar as CurrencyDollarIcon } from '@phosphor-icons/react/dist/ssr/CurrencyDollar';
import { Buildings as BuildingsIcon } from '@phosphor-icons/react/dist/ssr/Buildings';
import { aplicarViesOverride } from '@/utils/vies';

interface FII {
  id: string;
  avatar: string;
  ticker: string;
  setor: string;
  dataEntrada: string;
  precoEntrada: string;
  precoAtual: string;
  dy: string;
  precoTeto: string;
  vies: string;
  viesOverride?: 'AUTO' | 'MANTER';
}

interface CardsData {
  ibovespa?: {
    value: string;
    trend: 'up' | 'down';
    diff: number;
  };
  ifix?: {
    value: string;
    trend: 'up' | 'down';
    diff: number;
  };
  carteiraHoje?: {
    value: string;
    trend: 'up' | 'down';
    diff?: number;
  };
  dividendYield?: {
    value: string;
    trend: 'up' | 'down';
    diff?: number;
  };
}

interface SettingsTableProps {
  count: number;
  rows: FII[];
  cardsData?: CardsData;
  ibovespaReal?: any;
  ifixReal?: any;
}

function parsePrice(price: string): number {
  if (!price || typeof price !== 'string') return 0;
  return parseFloat(price.replace('R$ ', '').replace(',', '.')) || 0;
}

function calculatePerformance(precoEntrada: string, precoAtual: string): number {
  const entrada = parsePrice(precoEntrada);
  const atual = parsePrice(precoAtual);
  if (entrada <= 0) return 0;
  return ((atual - entrada) / entrada) * 100;
}

// 🎨 INDICADOR DE MERCADO DISCRETO E ELEGANTE (IGUAL AO OVERVIEW)
interface MarketIndicatorProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  diff?: number;
  isLoading?: boolean;
  description?: string;
  fonte?: string;
}

function MarketIndicator({ title, value, icon, trend, diff, isLoading, description, fonte }: MarketIndicatorProps): React.JSX.Element {
  const TrendIcon = trend === 'up' ? ArrowUpIcon : ArrowDownIcon;
  const trendColor = trend === 'up' ? '#10b981' : '#ef4444';
  
  return (
    <Box 
      sx={{ 
        backgroundColor: '#ffffff',
        borderRadius: 2,
        p: 2.5,
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        opacity: isLoading ? 0.7 : 1,
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: '#c7d2fe',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        }
      }}
    >
      <Stack spacing={2}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#64748b',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontSize: '0.75rem'
              }}
            >
              {title}
            </Typography>
            {description && (
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#94a3b8',
                  display: 'block',
                  mt: 0.25,
                  fontSize: '0.7rem'
                }}
              >
                {description}
              </Typography>
            )}
            {fonte && (
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#059669',
                  display: 'block',
                  mt: 0.25,
                  fontSize: '0.6rem',
                  fontWeight: 600
                }}
              >
                📡 {fonte}
              </Typography>
            )}
          </Box>
          <Box sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            backgroundColor: '#f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b'
          }}>
            {React.cloneElement(icon as React.ReactElement, { size: 16 })}
          </Box>
        </Stack>
        
        {/* Valor principal */}
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700,
            color: '#1e293b',
            fontSize: '1.75rem',
            lineHeight: 1
          }}
        >
          {isLoading ? '...' : value}
        </Typography>
        
        {/* Indicador de tendência */}
        {!isLoading && diff !== undefined && trend && (
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: trend === 'up' ? '#dcfce7' : '#fee2e2',
              color: trendColor
            }}>
              <TrendIcon size={12} weight="bold" />
            </Box>
            <Typography 
              variant="body2"
              sx={{ 
                color: trendColor,
                fontWeight: 600,
                fontSize: '0.875rem'
              }}
            >
              {diff > 0 ? '+' : ''}{typeof diff === 'number' ? diff.toFixed(2) : diff}%
            </Typography>
            <Typography 
              variant="body2"
              sx={{ 
                color: '#64748b',
                fontSize: '0.875rem'
              }}
            >
              hoje
            </Typography>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}

export function SettingsTable({ count, rows, cardsData, ibovespaReal, ifixReal }: SettingsTableProps): React.JSX.Element {
  // Validation
  if (!Array.isArray(rows) || rows.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <Typography variant="h6" color="text.secondary">
          📊 Nenhum FII encontrado na carteira
        </Typography>
      </Box>
    );
  }

  // 🔥 FORMATAÇÃO DINÂMICA DO IBOVESPA
  const formatarIbovespa = (valor: string) => {
    if (!valor) return '136.985';
    
    // Se já está formatado, manter
    if (valor.includes('.')) return valor;
    
    // Se é número sem formatação, adicionar pontos
    const numero = parseInt(valor);
    if (!isNaN(numero)) {
      return numero.toLocaleString('pt-BR');
    }
    
    return valor;
  };

  // 🎯 DADOS DOS INDICADORES COM PRIORIDADE PARA DADOS REAIS
  const indicators = React.useMemo(() => {
    // 📊 IBOVESPA: Priorizar dados reais do hook
    let ibovespaFinal;
    if (ibovespaReal) {
      console.log('🔥 USANDO IBOVESPA REAL:', ibovespaReal);
      ibovespaFinal = {
        value: ibovespaReal.valorFormatado,
        trend: ibovespaReal.trend,
        diff: ibovespaReal.variacaoPercent,
        fonte: ibovespaReal.fonte
      };
    } else if (cardsData?.ibovespa) {
      console.log('⚠️ USANDO IBOVESPA DOS CARDS:', cardsData.ibovespa);
      ibovespaFinal = {
        value: formatarIbovespa(cardsData.ibovespa.value),
        trend: cardsData.ibovespa.trend,
        diff: cardsData.ibovespa.diff
      };
    } else {
      console.log('🔄 USANDO IBOVESPA FALLBACK');
      ibovespaFinal = { value: '136.985', trend: 'down', diff: -0.02 };
    }

    // 🏢 IFIX: Priorizar dados reais do hook
    let ifixFinal;
    if (ifixReal) {
      console.log('🏢 USANDO IFIX REAL:', ifixReal);
      ifixFinal = {
        value: ifixReal.valorFormatado,
        trend: ifixReal.trend,
        diff: ifixReal.variacaoPercent,
        fonte: ifixReal.fonte
      };
    } else if (cardsData?.ifix) {
      console.log('⚠️ USANDO IFIX DOS CARDS:', cardsData.ifix);
      ifixFinal = cardsData.ifix;
    } else {
      console.log('🔄 USANDO IFIX FALLBACK ATUALIZADO');
      ifixFinal = { value: '3.435', trend: 'up', diff: 0.24 };
    }

    return {
      ibovespa: ibovespaFinal,
      ifix: ifixFinal
    };
  }, [ibovespaReal, ifixReal, cardsData]);

  console.log('🔥 SETTINGS TABLE - Indicadores finais:', indicators);

  return (
    <Box>
      {/* 🚨 ALERTAS DE STATUS DAS APIs */}
      {(ibovespaReal?.fonte?.includes('FALLBACK') || ifixReal?.fonte?.includes('FALLBACK')) && (
        <Box sx={{ mb: 3, p: 2, backgroundColor: '#fef3c7', borderRadius: 2, border: '1px solid #fde68a' }}>
          <Typography variant="body2" sx={{ color: '#d97706', fontWeight: 600 }}>
            ⚠️ Alguns dados estão em modo fallback:
          </Typography>
          {ibovespaReal?.fonte?.includes('FALLBACK') && (
            <Typography variant="caption" sx={{ color: '#92400e', display: 'block' }}>
              • IBOVESPA: Usando valor aproximado ({ibovespaReal.fonte})
            </Typography>
          )}
          {ifixReal?.fonte?.includes('FALLBACK') && (
            <Typography variant="caption" sx={{ color: '#92400e', display: 'block' }}>
              • IFIX: Usando valor aproximado ({ifixReal.fonte})
            </Typography>
          )}
        </Box>
      )}

      {/* Indicadores de Mercado - Layout Discreto (IGUAL AO OVERVIEW) */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2,
          mb: 4,
        }}
      >
        {/* IBOVESPA */}
        <MarketIndicator 
          title="IBOVESPA" 
          description="Índice da Bolsa Brasileira"
          value={indicators.ibovespa.value} 
          icon={<CurrencyDollarIcon />} 
          trend={indicators.ibovespa.trend as 'up' | 'down'} 
          diff={indicators.ibovespa.diff}
          fonte={indicators.ibovespa.fonte || 'FALLBACK'}
        />

        {/* IFIX */}
        <MarketIndicator 
          title="ÍNDICE IFIX" 
          description="Fundos Imobiliários da B3"
          value={indicators.ifix.value} 
          icon={<BuildingsIcon />} 
          trend={indicators.ifix.trend as 'up' | 'down'} 
          diff={indicators.ifix.diff}
          fonte={indicators.ifix.fonte || 'DINAMICO'}
        />
      </Box>
      
      {/* Tabela de FIIs */}
      <Card sx={{ 
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'rgba(148, 163, 184, 0.2)',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        overflow: 'hidden'
      }}>
        <Box sx={{ 
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          p: 4,
          borderBottom: '1px solid',
          borderColor: 'rgba(148, 163, 184, 0.2)'
        }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h5" sx={{ 
                fontWeight: 800, 
                color: '#1e293b',
                fontSize: '1.5rem',
                mb: 0.5
              }}>
                Carteira de FIIs Premium
              </Typography>
              <Typography variant="body1" sx={{ 
                color: '#64748b',
                fontSize: '1rem'
              }}>
                {count} fundos imobiliários • Viés calculado automaticamente
              </Typography>
            </Box>
            <Box sx={{
              background: 'linear-gradient(135deg, #000000 0%, #374151 100%)',
              color: 'white',
              px: 3,
              py: 1.5,
              borderRadius: 2,
              fontWeight: 600,
              fontSize: '0.875rem'
            }}>
              {count} FIIs
            </Box>
          </Stack>
        </Box>
        
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: '800px' }}>
            <TableHead>
              <TableRow sx={{ 
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              }}>
                <TableCell sx={{ 
                  fontWeight: 700, 
                  textAlign: 'center', 
                  width: '60px',
                  color: '#475569',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  #
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 700, 
                  color: '#475569', 
                  fontSize: '0.8rem', 
                  textTransform: 'uppercase'
                }}>
                  Ativo
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 700, 
                  textAlign: 'center', 
                  color: '#475569', 
                  fontSize: '0.8rem', 
                  textTransform: 'uppercase'
                }}>
                  Setor
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 700, 
                  textAlign: 'center', 
                  color: '#475569', 
                  fontSize: '0.8rem', 
                  textTransform: 'uppercase'
                }}>
                  Entrada
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 700, 
                  textAlign: 'center', 
                  color: '#475569', 
                  fontSize: '0.8rem', 
                  textTransform: 'uppercase'
                }}>
                  Preço Inicial
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 700, 
                  textAlign: 'center', 
                  color: '#475569', 
                  fontSize: '0.8rem', 
                  textTransform: 'uppercase'
                }}>
                  Preço Atual
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 700, 
                  textAlign: 'center', 
                  color: '#475569', 
                  fontSize: '0.8rem', 
                  textTransform: 'uppercase'
                }}>
                  DY
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 700, 
                  textAlign: 'center', 
                  color: '#475569', 
                  fontSize: '0.8rem', 
                  textTransform: 'uppercase'
                }}>
                  Teto
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 700, 
                  textAlign: 'center', 
                  color: '#475569', 
                  fontSize: '0.8rem', 
                  textTransform: 'uppercase'
                }}>
                  Viés
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => {
                // Validation for each row
                if (!row || !row.id || !row.ticker) {
                  console.warn('Invalid FII row:', row);
                  return null;
                }

                try {
                  const performance = calculatePerformance(row.precoEntrada || '', row.precoAtual || '');
                  const globalIndex = index + 1;
                  const viesCalculado = aplicarViesOverride(
                    (row.viesOverride as 'AUTO' | 'MANTER' | undefined),
                    row.vies || 'Aguardar'
                  );

                  return (
<TableRow 
  hover 
  key={row.id}
  onClick={() => window.location.href = `/dashboard/empresa/${row.ticker}`}
  sx={{
    cursor: 'pointer !important',  // ← FORÇAR COM !important
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
      cursor: 'pointer !important',  // ← TAMBÉM AQUI
      transform: 'scale(1.005)',
      transition: 'all 0.2s ease'
    },
    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
  }}
>
                      <TableCell sx={{ 
                        textAlign: 'center', 
                        fontWeight: 800, 
                        fontSize: '1rem',
                        color: '#000000'
                      }}>
                        {globalIndex}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar 
                            src={row.avatar} 
                            alt={row.ticker}
                            sx={{ 
                              width: 44, 
                              height: 44,
                              border: '2px solid',
                              borderColor: 'rgba(0, 0, 0, 0.2)'
                            }}
                          >
                            {row.ticker ? row.ticker.substring(0, 2) : '??'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" sx={{ 
                              fontWeight: 700,
                              color: '#1e293b',
                              fontSize: '1rem'
                            }}>
                              {row.ticker}
                            </Typography>
                            <Typography variant="caption" sx={{ 
                              color: performance >= 0 ? '#059669' : '#dc2626',
                              fontSize: '0.8rem',
                              fontWeight: 600
                            }}>
                              {performance > 0 ? '+' : ''}{performance.toFixed(1)}%
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip 
                          label={row.setor}
                          size="medium"
                          sx={{
                            backgroundColor: 'rgba(0, 0, 0, 0.1)',
                            color: '#000000',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            border: '1px solid rgba(0, 0, 0, 0.2)'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ 
                        textAlign: 'center',
                        color: '#64748b',
                        fontSize: '0.875rem',
                        whiteSpace: 'nowrap'
                      }}>
                        {row.dataEntrada}
                      </TableCell>
                      <TableCell sx={{ 
                        textAlign: 'center',
                        fontWeight: 600,
                        color: '#475569',
                        whiteSpace: 'nowrap',
                        fontSize: '0.9rem'
                      }}>
                        {row.precoEntrada}
                      </TableCell>
                      <TableCell sx={{ 
                        textAlign: 'center',
                        fontWeight: 700,
                        color: performance >= 0 ? '#10b981' : '#ef4444',
                        whiteSpace: 'nowrap',
                        fontSize: '0.9rem'
                      }}>
                        {row.precoAtual}
                      </TableCell>
                      <TableCell sx={{ 
                        textAlign: 'center',
                        fontWeight: 600,
                        color: '#000000',
                        whiteSpace: 'nowrap'
                      }}>
                        {row.dy}
                      </TableCell>
                      <TableCell sx={{ 
                        textAlign: 'center',
                        fontWeight: 600,
                        color: '#475569',
                        whiteSpace: 'nowrap'
                      }}>
                        {row.precoTeto}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip
                          label={viesCalculado}
                          size="medium"
                          sx={{
                            backgroundColor: (viesCalculado === 'Compra') ? '#dcfce7' : '#fef3c7',
                            color: (viesCalculado === 'Compra') ? '#059669' : '#d97706',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            border: '1px solid',
                            borderColor: (viesCalculado === 'Compra') ? '#bbf7d0' : '#fde68a',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                } catch (error) {
                  console.error('Erro ao renderizar linha do FII:', {
                    fii: row,
                    error: error instanceof Error ? error.message : 'Erro desconhecido'
                  });
                  return null;
                }
              })}
            </TableBody>
          </Table>
        </Box>
      </Card>
    </Box>
  );
}
