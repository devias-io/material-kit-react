export interface BRAPIResponse {
  results: BRAPIQuote[];
  requestedAt: string;
  took: number;
}

export interface BRAPIQuote {
  symbol: string;
  dividendsData: {
    cashDividends: BRAPICashDividend[];
    stockDividends: any[];
    subscriptions: any[];
  };
}

export interface BRAPICashDividend {
  assetIssued: string;
  paymentDate: string | null;
  rate: number;
  relatedTo: string;
  approvedOn: string | null;
  isinCode: string;
  label: string; // "DIVIDENDO" ou "JCP"
  lastDatePrior: string; // data COM
  remarks: string;
}

export interface ProventoSyncConfig {
  tickers?: string[];
  dataInicio?: Date;
  dataFim?: Date;
  forcarAtualizacao?: boolean;
}

export type ProventoOrigem = 'BRAPI' | 'CSV' | 'MANUAL';
