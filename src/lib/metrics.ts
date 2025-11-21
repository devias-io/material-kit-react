type MetricPayload = {
  route: string;
  cacheHit?: boolean;
  cacheBackend?: string;
  durationMs?: number;
  status?: number;
  extra?: Record<string, unknown>;
};

export function logApiMetric(payload: MetricPayload) {
  const enriched = {
    timestamp: new Date().toISOString(),
    ...payload,
  };

  // Structured log to make it easy to query in Vercel
  console.log('[api-metric]', JSON.stringify(enriched));
}
