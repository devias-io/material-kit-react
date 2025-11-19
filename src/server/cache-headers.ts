export type CacheHeaderOptions = {
  ttl?: number; // seconds
  swr?: number; // seconds
};

export function buildCacheHeaders(options: CacheHeaderOptions = {}) {
  const ttl = Math.max(1, Math.floor(options.ttl ?? 60));
  const swr = Math.max(ttl, Math.floor(options.swr ?? ttl * 5));
  const value = `public, s-maxage=${ttl}, stale-while-revalidate=${swr}`;

  return {
    'Cache-Control': value,
    'CDN-Cache-Control': value,
    'Vercel-CDN-Cache-Control': value,
  } as const;
}
