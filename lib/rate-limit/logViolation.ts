export function logRateLimitViolation(data:
  {
    apiKey: string;
    endpoint: string;
    method: string;
  }
) {
  console.warn("RATE_LIMIT_EXCEEDED", {
    apiKeyHash: data.apiKey.slice(0, 6) + "***",
    endpoint: data.endpoint,
    method: data.method,
    timestamp: new Date().toISOString(),
  });
}
