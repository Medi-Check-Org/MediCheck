import { redis } from "@/lib/redis";

type RateLimitConfig = {
  capacity: number;
  refillRate: number; // tokens per second
};


export async function checkRateLimit(apiKey: string, config: RateLimitConfig) {

  const key = `rate_limit:${apiKey}`;

  const now = Date.now();

  const data = await redis.hgetall<{
    tokens?: number;
    last_refill?: number;
  }>(key);

  let tokens = data?.tokens ?? config.capacity;

  let lastRefill = data?.last_refill ?? now;

  // Refill tokens
  const elapsedSeconds = (now - lastRefill) / 1000;

  const refill = elapsedSeconds * config.refillRate;

  tokens = Math.min(config.capacity, tokens + refill);

  if (tokens < 1) {
    // No tokens → reject
    return {
      allowed: false,
      remaining: 0,
    };
  }

  // Consume token
  tokens -= 1;

  // Persist state
  await redis.hset(key, {
    tokens,
    last_refill: now,
  });

  // Optional TTL safety (auto cleanup)
  await redis.expire(key, 60 * 60); // 1 hour

  return {
    allowed: true,
    remaining: Math.floor(tokens),
  };
  
}
