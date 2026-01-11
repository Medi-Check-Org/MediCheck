export const RATE_LIMITS = {
  PARTNER_DEFAULT: {
    capacity: 60,          // max tokens
    refillRate: 1,         // tokens per second
  },
  PARTNER_STRICT: {
    capacity: 10,
    refillRate: 1 / 6,     // ~10 per minute
  },
};
