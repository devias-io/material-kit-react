const KNOWN_BRAZILIAN_STOCK_UNITS = new Set([
  'ALUP11',
  'KLBN11',
  'SANB11'
]);

function normalizeTicker(rawTicker?: string | null): string | null {
  if (!rawTicker) {
    return null;
  }
  return rawTicker.trim().toUpperCase();
}

export function isBrazilianStockUnit(ticker?: string | null): boolean {
  const normalized = normalizeTicker(ticker);
  if (!normalized) {
    return false;
  }
  return KNOWN_BRAZILIAN_STOCK_UNITS.has(normalized);
}

export function isTickerFII(ticker?: string | null): boolean {
  const normalized = normalizeTicker(ticker);
  if (!normalized) {
    return false;
  }

  if (isBrazilianStockUnit(normalized)) {
    return false;
  }

  return /11([A-Z])?$/.test(normalized);
}
