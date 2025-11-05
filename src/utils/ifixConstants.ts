export const DEFAULT_IFIX_CURRENT = 3417.45;

export const IFIX_HISTORICAL_VALUES: Readonly<Record<string, number>> = Object.freeze({
  // 2020 - CRASH COVID
  '2020-0': 2850, '2020-1': 2800, '2020-2': 1950, '2020-3': 2200,
  '2020-4': 2400, '2020-5': 2650, '2020-6': 2750, '2020-7': 2820,
  '2020-8': 2900, '2020-9': 2850, '2020-10': 2950, '2020-11': 3100,

  // 2021 - ALTA VOLATILIDADE
  '2021-0': 3150, '2021-1': 3200, '2021-2': 3100, '2021-3': 3250,
  '2021-4': 3400, '2021-5': 3500, '2021-6': 3450, '2021-7': 3350,
  '2021-8': 3200, '2021-9': 3050, '2021-10': 2950, '2021-11': 3000,

  // 2022 - CORREÇÃO
  '2022-0': 3100, '2022-1': 3150, '2022-2': 3200, '2022-3': 3180,
  '2022-4': 3120, '2022-5': 2980, '2022-6': 2900, '2022-7': 3050,
  '2022-8': 3100, '2022-9': 3150, '2022-10': 3200, '2022-11': 3050,

  // 2023 - RECUPERAÇÃO
  '2023-0': 3080, '2023-1': 3120, '2023-2': 3050, '2023-3': 3100,
  '2023-4': 3150, '2023-5': 3200, '2023-6': 3250, '2023-7': 3220,
  '2023-8': 3180, '2023-9': 3140, '2023-10': 3200, '2023-11': 3280,

  // 2024 - ESTABILIZAÇÃO
  '2024-0': 3300, '2024-1': 3280, '2024-2': 3250, '2024-3': 3220,
  '2024-4': 3200, '2024-5': 3180, '2024-6': 3210, '2024-7': 3240,
  '2024-8': 3260, '2024-9': 3230, '2024-10': 3200, '2024-11': 3180,

  // 2025 - RECUPERAÇÃO (baseado nos dados reais de 2025)
  '2025-0': 3200, '2025-1': 3220, '2025-2': 3240, '2025-3': 3260,
  '2025-4': 3280, '2025-5': 3300, '2025-6': 3350, '2025-7': 3400,
});

const IFIX_STATIC_FALLBACK_BASE = Object.freeze({
  valor: 3435,
  valorFormatado: '3.435,00',
  variacao: 8.25,
  variacaoPercent: 0.24,
  trend: 'up' as 'up' | 'down',
});

const IFIX_REALTIME_FALLBACK_BASE = Object.freeze({
  valor: 3200,
  valorFormatado: '3.200',
  variacao: 8.0,
  variacaoPercent: 0.25,
  trend: 'up' as 'up' | 'down',
  volume: 125_000_000,
});

export type IfixStaticFallback = typeof IFIX_STATIC_FALLBACK_BASE;
export type IfixRealtimeFallback = typeof IFIX_REALTIME_FALLBACK_BASE;

export const DEFAULT_FII_MARKET_DATA_FALLBACK = Object.freeze({
  ifix: { value: '3.200', trend: 'up' as const, diff: 0.25 },
  carteiraHoje: { value: '12.4%', trend: 'up' as const, diff: 12.4 },
  dividendYield: { value: '11.8%', trend: 'up' as const, diff: 11.8 },
  carteiraPeriodo: { value: '15.2%', trend: 'up' as const, diff: 15.2 },
});

export const createStaticIfixFallbackPayload = (fonte: string) => ({
  ...IFIX_STATIC_FALLBACK_BASE,
  timestamp: new Date().toISOString(),
  fonte,
});

export const createRealtimeIfixFallbackPayload = (fonte: string) => ({
  ...IFIX_REALTIME_FALLBACK_BASE,
  timestamp: new Date().toISOString(),
  fonte,
});

