/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-shadow */
'use client';

import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { ArrowUp as ArrowUpIcon } from '@phosphor-icons/react/dist/ssr/ArrowUp';
import { ArrowDown as ArrowDownIcon } from '@phosphor-icons/react/dist/ssr/ArrowDown';
import { CurrencyDollar as CurrencyDollarIcon } from '@phosphor-icons/react/dist/ssr/CurrencyDollar';
import { UsersThree as UsersThreeIcon } from '@phosphor-icons/react/dist/ssr/UsersThree';
import { aplicarViesOverride } from '@/utils/vies';

function noop(): void {
  // Função vazia para props obrigatórias
}

// 🎨 INDICADOR DE MERCADO DISCRETO E ELEGANTE
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

export interface Ativo {
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

interface AtivosTableProps {
  count?: number;
  page?: number;
  rows?: Ativo[];
  rowsPerPage?: number;
  cardsData?: {
    ibovespa?: { value: string; trend?: 'up' | 'down'; diff?: number };
    indiceSmall?: { value: string; trend?: 'up' | 'down'; diff?: number };
    carteiraHoje?: { value: string; trend?: 'up' | 'down'; diff?: number };
    dividendYield?: { value: string; trend?: 'up' | 'down'; diff?: number };
    ibovespaPeriodo?: { value: string; trend?: 'up' | 'down'; diff?: number };
    carteiraPeriodo?: { value: string; trend?: 'up' | 'down'; diff?: number };
  };
  ibovespaReal?: {
    valorFormatado: string;
    trend: 'up' | 'down';
    variacaoPercent: number;
    fonte: string;
  };
}

export function AtivosTable({
  count = 0,
  rows = [],
  page = 0,
  rowsPerPage = 0,
  cardsData = {},
  ibovespaReal, // 🔥 RECEBENDO dados reais do Ibovespa
}: AtivosTableProps): React.JSX.Element {

  // 🔥 USAR DADOS REAIS DOS CARDS PASSADOS PELO PAGE.TSX
  const indicators = React.useMemo(() => {
    console.log('📊 Dados recebidos no AtivosTable:');
    console.log('  - cardsData:', cardsData);
    console.log('  - ibovespaReal:', ibovespaReal);
    
    return {
      ibovespa: cardsData.ibovespa || { value: "137.213", trend: "down" as const, diff: -0.26 },
      indiceSmall: cardsData.indiceSmall || { value: "2.205", trend: "down" as const, diff: -0.94 },
    };
  }, [cardsData, ibovespaReal]);

  // 🔥 DETECTAR SE AINDA ESTÁ CARREGANDO
  const isLoading = React.useMemo(() => {
    // Se não temos dados do cardsData ou são os valores padrão, considerar loading
    const hasRealData = cardsData.ibovespa || cardsData.indiceSmall;
    return !hasRealData;
  }, [cardsData]);

  return (
    <Box>
      {/* Indicadores de Mercado - Layout com 2 cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2,
          mb: 4,
        }}
      >
        <MarketIndicator 
          title="IBOVESPA" 
          description="Índice da Bolsa Brasileira"
          value={indicators.ibovespa.value} 
          icon={<CurrencyDollarIcon />} 
          trend={indicators.ibovespa.trend} 
          diff={indicators.ibovespa.diff}
          fonte={indicators.ibovespa.fonte || 'FALLBACK'}
          isLoading={false}
        />
        <MarketIndicator 
          title="ÍNDICE SMALL CAP" 
          description="Small Caps da B3"
          value={indicators.indiceSmall.value} 
          icon={<UsersThreeIcon />} 
          trend={indicators.indiceSmall.trend} 
          diff={indicators.indiceSmall.diff}
          fonte={indicators.indiceSmall.fonte || 'DINAMICO'}
          isLoading={false}
        />
      </Box>
      
      {/* Tabela de Micro Caps */}
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
                Carteira de Micro Caps
              </Typography>
              <Typography variant="body1" sx={{ 
                color: '#64748b',
                fontSize: '1rem'
              }}>
                {rows.length} ações em acompanhamento • Alto potencial de crescimento
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
              {rows.length} ações
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
                // CALCULAR PERFORMANCE SE TIVER COTAÇÃO
                let performance = 0;
                
                if (row.precoAtual !== 'N/A') {
                  const precoEntradaNum = parseFloat(row.precoEntrada.replace('R$ ', '').replace(',', '.'));
                  const precoAtualNum = parseFloat(row.precoAtual.replace('R$ ', '').replace(',', '.'));
                  performance = ((precoAtualNum - precoEntradaNum) / precoEntradaNum) * 100;
                }
                
                // CALCULAR VIÉS DINAMICAMENTE
                const calcularVies = (precoTeto: string, precoAtual: string, override?: string) => {
                  const overrideValor = override as 'AUTO' | 'MANTER' | undefined;
                  if (precoAtual === 'N/A') return aplicarViesOverride(overrideValor, 'Aguardar');

                  const precoTetoNum = parseFloat(precoTeto.replace('R$ ', '').replace(',', '.'));
                  const precoAtualNum = parseFloat(precoAtual.replace('R$ ', '').replace(',', '.'));

                  if (isNaN(precoTetoNum) || isNaN(precoAtualNum)) {
                    return aplicarViesOverride(overrideValor, 'Aguardar');
                  }

                  const viesAutomatico = precoAtualNum < precoTetoNum ? 'Compra' : 'Aguardar';
                  return aplicarViesOverride(overrideValor, viesAutomatico);
                };

                const viesCalculado = calcularVies(row.precoTeto, row.precoAtual, row.viesOverride);
                
                return (
                  <TableRow 
                    hover 
                    key={row.id}
                    onClick={() => window.location.href = `/dashboard/empresa/${row.ticker}`}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        cursor: 'pointer',
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
                      {index + 1}
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
                        />
                        <Box>
                          <Typography variant="subtitle1" sx={{ 
                            fontWeight: 700,
                            color: '#1e293b',
                            fontSize: '1rem'
                          }}>
                            {row.ticker}
                          </Typography>
                          {/* EXIBIR PERFORMANCE REAL OU 'N/A' SE SEM DADOS */}
                          <Typography variant="caption" sx={{ 
                            color: row.precoAtual === 'N/A' ? '#64748b' : 
                                   performance >= 0 ? '#059669' : '#dc2626',
                            fontSize: '0.8rem',
                            fontWeight: 600
                          }}>
                            {row.precoAtual === 'N/A' ? 'Sem dados' : 
                             `${performance > 0 ? '+' : ''}${performance.toFixed(1)}%`}
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
                      color: row.precoAtual === 'N/A' ? '#64748b' :
                             performance >= 0 ? '#10b981' : '#ef4444',
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
                          backgroundColor: viesCalculado === 'Compra' ? '#dcfce7' : '#fef3c7',
                          color: viesCalculado === 'Compra' ? '#059669' : '#d97706',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          border: '1px solid',
                          borderColor: viesCalculado === 'Compra' ? '#bbf7d0' : '#fde68a',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
        <Divider />
        <TablePagination
          component="div"
          count={count}
          onPageChange={noop}
          onRowsPerPage={noop}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
          labelRowsPerPage="Itens por página:"
          labelDisplayedRows={({ from, to, count: totalCount }) => 
            `${from}-${to} de ${totalCount !== -1 ? totalCount : `mais de ${to}`}`
          }
          sx={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            p: 2,
            '& .MuiTablePagination-toolbar': {
              color: '#475569'
            }
          }}
        />
      </Card>
    </Box>
  );
}
