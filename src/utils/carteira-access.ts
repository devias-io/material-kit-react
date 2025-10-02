export const CARTEIRA_PERMISSION_MAP = {
  smallCaps: 'small-caps',
  microCaps: 'micro-caps',
  dividendos: 'dividendos',
  fiis: 'fundos-imobiliarios',
  dividendosInternacional: 'internacional-dividendos',
  etfs: 'internacional-etfs',
  projetoAmerica: 'internacional-projeto-america',
  exteriorStocks: 'internacional-stocks'
} as const;

export type CarteiraKey = keyof typeof CARTEIRA_PERMISSION_MAP;

export const ALL_CARTEIRA_KEYS = Object.keys(CARTEIRA_PERMISSION_MAP) as CarteiraKey[];

const PAGE_TO_CARTEIRAS: Record<string, CarteiraKey[]> = {
  'small-caps': ['smallCaps'],
  'micro-caps': ['microCaps'],
  dividendos: ['dividendos'],
  'fundos-imobiliarios': ['fiis'],
  'internacional-dividendos': ['dividendosInternacional'],
  'internacional-etfs': ['etfs'],
  'internacional-projeto-america': ['projetoAmerica'],
  'internacional-stocks': ['exteriorStocks'],
  internacional: ['dividendosInternacional', 'etfs', 'projetoAmerica', 'exteriorStocks']
};

const normalizeTicker = (ticker: string) => ticker?.toUpperCase?.().trim?.() || '';

export const CARTEIRA_TICKERS: Record<CarteiraKey, string[]> = {
  smallCaps: [
    'ALOS3', 'TUPY3', 'RECV3', 'CSED3', 'PRIO3', 'RAPT4', 'SMTO3', 'FESA4', 'UNIP6', 'FLRY3',
    'EZTC3', 'JALL3', 'YDUQ3', 'SIMH3', 'ALUP11', 'NEOE3'
  ],
  microCaps: [
    'DEXP3', 'KEPL3', 'EVEN3', 'WIZC3', 'RANI3', 'SHUL4', 'RSUL4', 'TASA4', 'TRIS3', 'CGRA4',
    'ROMI3', 'POSI3', 'CEAB3', 'LOGG3', 'AGRO3'
  ],
  dividendos: [
    'LEVE3', 'EGIE3', 'VALE3', 'BBAS3', 'BRSR6', 'PETR4', 'SAPR4', 'ELET3', 'ABCB4', 'CSMG3',
    'BBSE3', 'ISAE4', 'VIVT3', 'KLBN11', 'SANB11', 'CPLE6'
  ],
  fiis: [
    'MALL11', 'KNSC11', 'KNHF11', 'HGBS11', 'RURA11', 'BCIA11', 'BPFF11', 'HGFF11', 'BRCO11',
    'XPML11', 'HGLG11', 'HSML11', 'VGIP11', 'AFHI11', 'BTLG11', 'VRTA11', 'LVBI11', 'HGRU11'
  ],
  dividendosInternacional: ['OXY', 'ADC', 'VZ', 'O', 'AVB', 'STAG'],
  etfs: ['VOO', 'IJS', 'QUAL', 'QQQ', 'VNQ', 'SCHP', 'IAU', 'HERO', 'SOXX', 'MCHI', 'TFLO'],
  projetoAmerica: ['NVDA', 'AMZN', 'PEP', 'IAU', 'WPC', 'NOBL', 'CRM', 'AMD', 'TLT', 'QQQ', 'NNN'],
  exteriorStocks: ['AMD', 'XP', 'HD', 'AAPL', 'FIVE', 'AMAT', 'COST', 'GOOGL', 'META', 'BRK.B']
};

export const createEmptyCarteirasData = () => {
  return ALL_CARTEIRA_KEYS.reduce<Record<string, any[]>>((acc, carteira) => {
    acc[carteira] = [];
    return acc;
  }, {});
};

export const sanitizeCarteirasData = (
  data: Record<string, any>,
  allowedCarteiras: Set<CarteiraKey>
) => {
  const sanitized: Record<string, any[]> = {};

  ALL_CARTEIRA_KEYS.forEach(carteira => {
    if (allowedCarteiras.has(carteira)) {
      sanitized[carteira] = Array.isArray(data?.[carteira]) ? data[carteira] : [];
    } else {
      sanitized[carteira] = [];
    }
  });

  return sanitized;
};

export const resolveCarteirasPermitidas = (
  pages: string[] | undefined,
  { userPlan }: { userPlan?: string } = {}
) => {
  if (userPlan === 'ADMIN') {
    return new Set<CarteiraKey>(ALL_CARTEIRA_KEYS);
  }

  if (!pages || pages.length === 0) {
    return new Set<CarteiraKey>();
  }

  const allowed = new Set<CarteiraKey>();

  pages.forEach(page => {
    const carteiras = PAGE_TO_CARTEIRAS[page];
    if (carteiras) {
      carteiras.forEach(carteira => allowed.add(carteira));
    }
  });

  return allowed;
};

export const getCarteirasForTicker = (
  ticker: string | undefined,
  dados?: Record<string, any[]>
): CarteiraKey[] => {
  if (!ticker) return [];

  const normalizedTicker = normalizeTicker(ticker);
  if (!normalizedTicker) return [];

  const found = new Set<CarteiraKey>();

  if (dados) {
    ALL_CARTEIRA_KEYS.forEach(carteira => {
      const ativos = dados[carteira];
      if (Array.isArray(ativos) && ativos.some(ativo => normalizeTicker(ativo?.ticker) === normalizedTicker)) {
        found.add(carteira);
      }
    });
  }

  if (found.size === 0) {
    ALL_CARTEIRA_KEYS.forEach(carteira => {
      const tickers = CARTEIRA_TICKERS[carteira];
      if (tickers?.some(t => normalizeTicker(t) === normalizedTicker)) {
        found.add(carteira);
      }
    });
  }

  return Array.from(found);
};
