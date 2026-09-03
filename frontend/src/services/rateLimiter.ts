/**
 * GRAM-X Client-Side Sliding-Window Rate Limiter
 * Guards sensitive endpoints (login, registration, grievance creation, AI analysis) from rapid abuse.
 */

interface RateLimitRule {
  maxRequests: number;
  windowMs: number;
}

const RULES: Record<string, RateLimitRule> = {
  login: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 per min
  register: { maxRequests: 3, windowMs: 5 * 60 * 1000 }, // 3 per 5 mins
  submit_grievance: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
  ai_analysis: { maxRequests: 20, windowMs: 60 * 1000 }, // 20 per min
};

const timestampsStore: Record<string, number[]> = {};

export const checkRateLimit = (action: keyof typeof RULES | string): { allowed: boolean; retryAfterSeconds?: number } => {
  const rule = RULES[action] || { maxRequests: 30, windowMs: 60 * 1000 };
  const now = Date.now();
  const timestamps = (timestampsStore[action] || []).filter((t) => now - t < rule.windowMs);

  if (timestamps.length >= rule.maxRequests) {
    const oldest = timestamps[0];
    const retryAfter = Math.ceil((oldest + rule.windowMs - now) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(1, retryAfter) };
  }

  timestamps.push(now);
  timestampsStore[action] = timestamps;
  return { allowed: true };
};

export const resetRateLimits = (): void => {
  for (const k of Object.keys(timestampsStore)) {
    delete timestampsStore[k];
  }
};

export default {
  checkRateLimit,
  resetRateLimits,
};
