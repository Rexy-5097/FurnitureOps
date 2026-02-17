import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// PRODUCTION PARITY: Hard assertions — no fallback to empty strings
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!redisUrl || !redisToken) {
  throw new Error('PRODUCTION PARITY FAILURE: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required');
}

// Initialize Redis client — singleton for hot lambda reuse
const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});

// Create a new Ratelimit instance
// slidingWindow: 20 requests per 60 seconds
export const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(20, '60 s'),
  analytics: true,
  prefix: '@upstash/ratelimit',
});

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};
