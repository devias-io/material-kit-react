// src/data/carteiras-default.ts
// Dados estáticos utilizados como fallback para as carteiras
// Exportamos em um módulo separado para que possam ser reutilizados
// tanto no client (hooks) quanto em rotas da API.

export type CarteiraCategoriaKey =
  | 'smallCaps'
  | 'microCaps'
  | 'dividendos'
  | 'fiis'
  | 'cfRendaTurbinada'
  | 'dividendosInternacional'
  | 'etfs'
  | 'projetoAmerica'
  | 'exteriorStocks';

export interface CarteiraAtivoBase {
  id: string;
  ticker: string;
  dataEntrada: string;
  setor: string;
  precoEntrada: number;
  precoTeto?: number;
  precoTetoBDR?: number;
}

interface CarteiraDadosPorCategoria {
  smallCaps: CarteiraAtivoBase[];
  microCaps: CarteiraAtivoBase[];
  dividendos: CarteiraAtivoBase[];
  fiis: (CarteiraAtivoBase & { precoTeto: number })[];
  cfRendaTurbinada: CarteiraAtivoBase[];
  dividendosInternacional: (CarteiraAtivoBase & { precoTetoBDR?: number })[];
  etfs: CarteiraAtivoBase[];
  projetoAmerica: (CarteiraAtivoBase & { precoTetoBDR?: number })[];
  exteriorStocks: (CarteiraAtivoBase & { precoTetoBDR?: number })[];
}

export const DEFAULT_CARTEIRAS_DATA: CarteiraDadosPorCategoria = {
  smallCaps: [
    { id: 'sc1', ticker: 'ALOS3', dataEntrada: '15/01/2021', precoEntrada: 26.68, precoTeto: 23.76, setor: 'Shoppings' },
    { id: 'sc2', ticker: 'TUPY3', dataEntrada: '04/11/2020', precoEntrada: 20.36, precoTeto: 31.5, setor: 'Industrial' },
    { id: 'sc3', ticker: 'RECV3', dataEntrada: '23/07/2023', precoEntrada: 22.29, precoTeto: 31.37, setor: 'Petróleo' },
    { id: 'sc4', ticker: 'CSED3', dataEntrada: '10/12/2023', precoEntrada: 4.49, precoTeto: 8.35, setor: 'Educação' },
    { id: 'sc5', ticker: 'PRIO3', dataEntrada: '04/08/2022', precoEntrada: 23.35, precoTeto: 48.7, setor: 'Petróleo' },
    { id: 'sc6', ticker: 'RAPT4', dataEntrada: '16/09/2021', precoEntrada: 16.69, precoTeto: 14, setor: 'Industrial' },
    { id: 'sc7', ticker: 'SMTO3', dataEntrada: '10/11/2022', precoEntrada: 28.2, precoTeto: 35, setor: 'Sucroenergético' },
    { id: 'sc8', ticker: 'FESA4', dataEntrada: '11/12/2020', precoEntrada: 4.49, precoTeto: 14.07, setor: 'Commodities' },
    { id: 'sc9', ticker: 'UNIP6', dataEntrada: '08/12/2020', precoEntrada: 42.41, precoTeto: 117.9, setor: 'Químico' },
    { id: 'sc10', ticker: 'FLRY3', dataEntrada: '19/05/2022', precoEntrada: 14.63, precoTeto: 17.5, setor: 'Saúde' },
    { id: 'sc11', ticker: 'EZTC3', dataEntrada: '07/10/2022', precoEntrada: 22.61, precoTeto: 30, setor: 'Construção Civil' },
    { id: 'sc12', ticker: 'JALL3', dataEntrada: '17/06/2022', precoEntrada: 8.36, precoTeto: 11.9, setor: 'Sucroenergético' },
    { id: 'sc13', ticker: 'YDUQ3', dataEntrada: '11/11/2020', precoEntrada: 27.16, precoTeto: 15, setor: 'Educação' },
    { id: 'sc14', ticker: 'SIMH3', dataEntrada: '03/12/2020', precoEntrada: 7.98, precoTeto: 10.79, setor: 'Logística' },
    { id: 'sc15', ticker: 'ALUP11', dataEntrada: '25/11/2020', precoEntrada: 24.4, precoTeto: 29, setor: 'Energia' },
    { id: 'sc16', ticker: 'NEOE3', dataEntrada: '04/05/2021', precoEntrada: 15.94, precoTeto: 21, setor: 'Energia' },
  ],
  microCaps: [
    { id: 'mc1', ticker: 'DEXP3', dataEntrada: '27/01/2023', precoEntrada: 7.96, precoTeto: 13.1, setor: 'Nanocap/Químico' },
    { id: 'mc2', ticker: 'KEPL3', dataEntrada: '21/12/2020', precoEntrada: 9.16, precoTeto: 11, setor: 'Agricultura' },
    { id: 'mc3', ticker: 'EVEN3', dataEntrada: '06/06/2022', precoEntrada: 5.18, precoTeto: 8.5, setor: 'C. Civil' },
    { id: 'mc4', ticker: 'WIZC3', dataEntrada: '30/04/2021', precoEntrada: 10.94, precoTeto: 12, setor: 'Seguros' },
    { id: 'mc5', ticker: 'RANI3', dataEntrada: '19/11/2020', precoEntrada: 4.65, precoTeto: 10.57, setor: 'Papel' },
    { id: 'mc6', ticker: 'SHUL4', dataEntrada: '04/03/2021', precoEntrada: 3.47, precoTeto: 5.45, setor: 'Industrial' },
    { id: 'mc7', ticker: 'RSUL4', dataEntrada: '06/08/2021', precoEntrada: 85, precoTeto: 100, setor: 'Nanocap/Industrial' },
    { id: 'mc8', ticker: 'TASA4', dataEntrada: '27/06/2022', precoEntrada: 17.14, precoTeto: 25.5, setor: 'Bens Industriais' },
    { id: 'mc9', ticker: 'TRIS3', dataEntrada: '25/02/2022', precoEntrada: 5.15, precoTeto: 5.79, setor: 'C. Civil' },
    { id: 'mc10', ticker: 'CGRA4', dataEntrada: '09/03/2023', precoEntrada: 29, precoTeto: 42.5, setor: 'Nanocap/C. cíclico' },
    { id: 'mc11', ticker: 'ROMI3', dataEntrada: '19/07/2022', precoEntrada: 12.02, precoTeto: 19.4, setor: 'Bens Industriais' },
    { id: 'mc12', ticker: 'POSI3', dataEntrada: '22/04/2022', precoEntrada: 8.67, precoTeto: 10.16, setor: 'Tecnologia' },
    { id: 'mc13', ticker: 'CEAB3', dataEntrada: '04/05/2023', precoEntrada: 2.95, precoTeto: 10.94, setor: 'Consumo cíclico' },
    { id: 'mc14', ticker: 'LOGG3', dataEntrada: '25/11/2022', precoEntrada: 18.96, precoTeto: 25, setor: 'Logística' },
    { id: 'mc15', ticker: 'AGRO3', dataEntrada: '09/10/2020', precoEntrada: 23, precoTeto: 31.8, setor: 'Agricultura' },
  ],
  dividendos: [
    { id: 'div1', ticker: 'LEVE3', dataEntrada: '06/12/2024', precoEntrada: 27.74, precoTeto: 35.27, setor: 'Automotivo' },
    { id: 'div2', ticker: 'EGIE3', dataEntrada: '31/03/2022', precoEntrada: 43.13, precoTeto: 50.34, setor: 'Energia' },
    { id: 'div3', ticker: 'VALE3', dataEntrada: '17/07/2023', precoEntrada: 68.61, precoTeto: 78.2, setor: 'Mineração' },
    { id: 'div4', ticker: 'BBAS3', dataEntrada: '20/10/2021', precoEntrada: 15.6, precoTeto: 30.1, setor: 'Bancos' },
    { id: 'div5', ticker: 'BRSR6', dataEntrada: '12/05/2022', precoEntrada: 10.6, precoTeto: 15.1, setor: 'Bancos' },
    { id: 'div6', ticker: 'PETR4', dataEntrada: '24/05/2022', precoEntrada: 30.97, precoTeto: 37.5, setor: 'Petróleo' },
    { id: 'div7', ticker: 'SAPR4', dataEntrada: '27/10/2021', precoEntrada: 3.81, precoTeto: 6, setor: 'Saneamento' },
    { id: 'div8', ticker: 'ELET3', dataEntrada: '20/11/2023', precoEntrada: 40.41, precoTeto: 58.27, setor: 'Energia' },
    { id: 'div9', ticker: 'ABCB4', dataEntrada: '19/06/2023', precoEntrada: 17.87, precoTeto: 22.3, setor: 'Bancos' },
    { id: 'div10', ticker: 'CSMG3', dataEntrada: '19/08/2022', precoEntrada: 13.68, precoTeto: 19.16, setor: 'Saneamento' },
    { id: 'div11', ticker: 'BBSE3', dataEntrada: '30/06/2022', precoEntrada: 25.48, precoTeto: 33.2, setor: 'Financeiro' },
    { id: 'div12', ticker: 'ISAE4', dataEntrada: '22/10/2021', precoEntrada: 24, precoTeto: 26.5, setor: 'Energia' },
    { id: 'div13', ticker: 'VIVT3', dataEntrada: '05/04/2022', precoEntrada: 54.6, precoTeto: 29, setor: 'Telecom' },
    { id: 'div14', ticker: 'KLBN11', dataEntrada: '09/06/2022', precoEntrada: 21.94, precoTeto: 27.6, setor: 'Papel e Celulose' },
    { id: 'div15', ticker: 'SANB11', dataEntrada: '08/12/2022', precoEntrada: 27.6, precoTeto: 31.76, setor: 'Bancos' },
    { id: 'div16', ticker: 'CPLE6', dataEntrada: '10/11/2021', precoEntrada: 6.28, precoTeto: 7.25, setor: 'Energia' },
  ],
  fiis: [
    { id: 'fii1', ticker: 'MALL11', dataEntrada: '26/01/2022', precoEntrada: 118.37, precoTeto: 103.68, setor: 'Shopping' },
    { id: 'fii2', ticker: 'KNSC11', dataEntrada: '24/05/2022', precoEntrada: 9.31, precoTeto: 9.16, setor: 'Papel' },
    { id: 'fii3', ticker: 'KNHF11', dataEntrada: '20/12/2024', precoEntrada: 76.31, precoTeto: 90.5, setor: 'Hedge Fund' },
    { id: 'fii4', ticker: 'HGBS11', dataEntrada: '02/01/2025', precoEntrada: 186.08, precoTeto: 192, setor: 'Shopping' },
    { id: 'fii5', ticker: 'RURA11', dataEntrada: '14/02/2023', precoEntrada: 10.25, precoTeto: 8.7, setor: 'Fiagro' },
    { id: 'fii6', ticker: 'BCIA11', dataEntrada: '12/04/2023', precoEntrada: 82.28, precoTeto: 87.81, setor: 'FoF' },
    { id: 'fii7', ticker: 'BPFF11', dataEntrada: '08/01/2024', precoEntrada: 72.12, precoTeto: 66.26, setor: 'FoF' },
    { id: 'fii8', ticker: 'HGFF11', dataEntrada: '03/04/2023', precoEntrada: 69.15, precoTeto: 73.59, setor: 'FoF' },
    { id: 'fii9', ticker: 'BRCO11', dataEntrada: '09/05/2022', precoEntrada: 99.25, precoTeto: 109.89, setor: 'Logística' },
    { id: 'fii10', ticker: 'XPML11', dataEntrada: '16/02/2022', precoEntrada: 93.32, precoTeto: 110.4, setor: 'Shopping' },
    { id: 'fii11', ticker: 'HGLG11', dataEntrada: '20/06/2022', precoEntrada: 161.8, precoTeto: 146.67, setor: 'Logística' },
    { id: 'fii12', ticker: 'HSML11', dataEntrada: '14/06/2022', precoEntrada: 78, precoTeto: 93.6, setor: 'Shopping' },
    { id: 'fii13', ticker: 'VGIP11', dataEntrada: '02/12/2021', precoEntrada: 96.99, precoTeto: 88, setor: 'Papel' },
    { id: 'fii14', ticker: 'AFHI11', dataEntrada: '05/07/2022', precoEntrada: 99.91, precoTeto: 93.2, setor: 'Papel' },
    { id: 'fii15', ticker: 'BTLG11', dataEntrada: '05/01/2022', precoEntrada: 103.14, precoTeto: 104, setor: 'Logística' },
    { id: 'fii16', ticker: 'VRTA11', dataEntrada: '27/12/2022', precoEntrada: 88.3, precoTeto: 94.33, setor: 'Papel' },
    { id: 'fii17', ticker: 'LVBI11', dataEntrada: '18/10/2022', precoEntrada: 113.85, precoTeto: 122.51, setor: 'Logística' },
    { id: 'fii18', ticker: 'HGRU11', dataEntrada: '17/05/2022', precoEntrada: 115, precoTeto: 138.57, setor: 'Renda Urbana' },
    { id: 'fii19', ticker: 'ALZR11', dataEntrada: '02/02/2022', precoEntrada: 115.89, precoTeto: 101.6, setor: 'Híbrido' },
    { id: 'fii20', ticker: 'BCRI11', dataEntrada: '25/11/2021', precoEntrada: 104.53, precoTeto: 87.81, setor: 'Papel' },
    { id: 'fii21', ticker: 'KNRI11', dataEntrada: '27/06/2022', precoEntrada: 131.12, precoTeto: 146.67, setor: 'Híbrido' },
    { id: 'fii22', ticker: 'IRDM11', dataEntrada: '05/01/2022', precoEntrada: 107.04, precoTeto: 73.2, setor: 'Papel' },
    { id: 'fii23', ticker: 'MXRF11', dataEntrada: '12/07/2022', precoEntrada: 9.69, precoTeto: 9.4, setor: 'Papel' },
  ],
  cfRendaTurbinada: [],
  dividendosInternacional: [
    { id: 'dint1', ticker: 'OXY', dataEntrada: '14/04/2023', precoEntrada: 37.92, precoTeto: 60.1, precoTetoBDR: 351.58, setor: 'Petroleum' },
    { id: 'dint2', ticker: 'ADC', dataEntrada: '19/01/2023', precoEntrada: 73.74, precoTeto: 99.01, setor: 'REIT - Retail' },
    { id: 'dint3', ticker: 'VZ', dataEntrada: '28/03/2022', precoEntrada: 51.17, precoTeto: 51.12, setor: 'Telecom' },
    { id: 'dint4', ticker: 'O', dataEntrada: '01/02/2024', precoEntrada: 54.39, precoTetoBDR: 344.6, setor: 'REIT - Net Lease' },
    { id: 'dint5', ticker: 'AVB', dataEntrada: '10/02/2022', precoEntrada: 242, precoTeto: 340, setor: 'REIT - Apartamentos' },
    { id: 'dint6', ticker: 'STAG', dataEntrada: '24/03/2022', precoEntrada: 40.51, precoTeto: 42.87, setor: 'REIT - Industrial' },
  ],
  etfs: [
    { id: 'etf1', ticker: 'VOO', dataEntrada: '03/06/2021', precoEntrada: 383.95, setor: 'Large Cap' },
    { id: 'etf2', ticker: 'IJS', dataEntrada: '21/07/2021', precoEntrada: 100.96, setor: 'Small Caps' },
    { id: 'etf3', ticker: 'QUAL', dataEntrada: '11/06/2021', precoEntrada: 130.13, setor: 'Total Market' },
    { id: 'etf4', ticker: 'QQQ', dataEntrada: '09/06/2021', precoEntrada: 337.18, setor: 'Large Cap' },
    { id: 'etf5', ticker: 'VNQ', dataEntrada: '12/07/2021', precoEntrada: 105.96, setor: 'Real Estate' },
    { id: 'etf6', ticker: 'SCHP', dataEntrada: '22/11/2021', precoEntrada: 63.14, setor: 'Renda Fixa' },
    { id: 'etf7', ticker: 'IAU', dataEntrada: '07/06/2021', precoEntrada: 36.04, setor: 'Ouro' },
    { id: 'etf8', ticker: 'HERO', dataEntrada: '15/07/2021', precoEntrada: 31.28, setor: 'Games' },
    { id: 'etf9', ticker: 'SOXX', dataEntrada: '04/08/2021', precoEntrada: 156.03, setor: 'Semicondutores' },
    { id: 'etf10', ticker: 'MCHI', dataEntrada: '01/02/2023', precoEntrada: 53.58, setor: 'China' },
    { id: 'etf11', ticker: 'TFLO', dataEntrada: '21/03/2023', precoEntrada: 50.5, setor: 'Renda Fixa' },
  ],
  projetoAmerica: [
    { id: 'pa1', ticker: 'NVDA', dataEntrada: '09/04/2025', precoEntrada: 98.88, precoTeto: 110, precoTetoBDR: 643.5, setor: 'Tecnologia' },
    { id: 'pa2', ticker: 'AMZN', dataEntrada: '16/04/2025', precoEntrada: 176.29, precoTeto: 203, setor: 'Varejo' },
    { id: 'pa3', ticker: 'PEP', dataEntrada: '22/04/2025', precoEntrada: 141.78, precoTeto: 149.66, setor: 'Consumo' },
    { id: 'pa4', ticker: 'IAU', dataEntrada: '30/04/2025', precoEntrada: 62.48, setor: 'ETF' },
    { id: 'pa5', ticker: 'WPC', dataEntrada: '07/05/2025', precoEntrada: 62.17, precoTeto: 65, setor: 'REIT' },
    { id: 'pa6', ticker: 'NOBL', dataEntrada: '14/05/2025', precoEntrada: 99.26, setor: 'ETF' },
    { id: 'pa7', ticker: 'CRM', dataEntrada: '21/05/2025', precoEntrada: 285.85, precoTeto: 310, setor: 'Tecnologia' },
    { id: 'pa8', ticker: 'AMD', dataEntrada: '29/05/2025', precoEntrada: 112.86, precoTeto: 135.2, setor: 'Tecnologia' },
    { id: 'pa9', ticker: 'TLT', dataEntrada: '05/06/2025', precoEntrada: 86.62, setor: 'ETF' },
    { id: 'pa10', ticker: 'QQQ', dataEntrada: '12/06/2025', precoEntrada: 353.38, setor: 'ETF' },
    { id: 'pa11', ticker: 'NNN', dataEntrada: '18/06/2025', precoEntrada: 42.9, precoTeto: 45.1, setor: 'REIT' },
  ],
  exteriorStocks: [
    { id: 'es1', ticker: 'AMD', dataEntrada: '29/05/2025', precoEntrada: 112.86, precoTeto: 135.2, precoTetoBDR: 791.42, setor: 'Tecnologia' },
    { id: 'es2', ticker: 'XP', dataEntrada: '26/05/2023', precoEntrada: 18.41, precoTeto: 24.34, setor: 'Financial Services' },
    { id: 'es3', ticker: 'HD', dataEntrada: '24/02/2023', precoEntrada: 299.31, precoTeto: 366.78, setor: 'Varejo' },
    { id: 'es4', ticker: 'AAPL', dataEntrada: '05/05/2022', precoEntrada: 156.77, precoTeto: 170, setor: 'Tecnologia' },
    { id: 'es5', ticker: 'FIVE', dataEntrada: '17/03/2022', precoEntrada: 163.41, precoTeto: 179, setor: 'Varejo' },
    { id: 'es6', ticker: 'AMAT', dataEntrada: '07/04/2022', precoEntrada: 122.4, precoTeto: 151.3, setor: 'Semicondutores' },
    { id: 'es7', ticker: 'COST', dataEntrada: '23/06/2022', precoEntrada: 459, precoTeto: 571, setor: 'Consumer' },
    { id: 'es8', ticker: 'GOOGL', dataEntrada: '06/03/2022', precoEntrada: 131.83, precoTeto: 160, setor: 'Tecnologia' },
  ],
};

export function getDefaultCarteira(key: CarteiraCategoriaKey) {
  return DEFAULT_CARTEIRAS_DATA[key] || [];
}

export const DEFAULT_FIIS_PORTFOLIO = DEFAULT_CARTEIRAS_DATA.fiis;
