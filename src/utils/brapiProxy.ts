export type QuoteQueryParams = Record<string, string | number | boolean | undefined | null>;

export const buildQuotesUrl = (symbols: string | string[], params: QuoteQueryParams = {}) => {
  const symbolList = Array.isArray(symbols) ? symbols : symbols.split(',').map(s => s.trim()).filter(Boolean);
  const searchParams = new URLSearchParams();

  if (symbolList.length > 0) {
    searchParams.set('symbols', symbolList.join(','));
  }

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();
  return queryString ? `/api/financial/quotes?${queryString}` : '/api/financial/quotes';
};

export const getQuoteResults = (payload: any) => {
  if (Array.isArray(payload?.quotes)) {
    return payload.quotes;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  return [];
};
