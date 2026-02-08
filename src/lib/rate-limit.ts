/**
 * Simple in-memory rate limiter for submissions.
 * In production with multiple instances, consider using Vercel KV or Redis.
 *
 * Limits: 3 submissions per hour, 10 per day per IP
 */

type RateLimitRecord = {
  hourCount: number;
  hourResetAt: number;
  dayCount: number;
  dayResetAt: number;
};

// In-memory store - will reset on server restart
// This is acceptable for low-volume use; use Vercel KV for production scaling
const store = new Map<string, RateLimitRecord>();

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const HOURLY_LIMIT = 3;
const DAILY_LIMIT = 10;

export type RateLimitResult = {
  allowed: boolean;
  remaining: {
    hour: number;
    day: number;
  };
  resetIn: {
    hour: number; // seconds until hourly reset
    day: number;  // seconds until daily reset
  };
  reason?: string;
};

/**
 * Check if an IP is allowed to submit.
 * Call this before processing a submission.
 * Use the namespace parameter to separate rate limits for different endpoints.
 */
export function checkRateLimit(ip: string, namespace: string = "default"): RateLimitResult {
  const now = Date.now();
  const key = `${namespace}:${ip}`;
  let record = store.get(key);

  // Initialize or reset expired records
  if (!record) {
    record = {
      hourCount: 0,
      hourResetAt: now + HOUR_MS,
      dayCount: 0,
      dayResetAt: now + DAY_MS,
    };
  } else {
    // Reset hourly counter if expired
    if (now >= record.hourResetAt) {
      record.hourCount = 0;
      record.hourResetAt = now + HOUR_MS;
    }
    // Reset daily counter if expired
    if (now >= record.dayResetAt) {
      record.dayCount = 0;
      record.dayResetAt = now + DAY_MS;
    }
  }

  const hourRemaining = Math.max(0, HOURLY_LIMIT - record.hourCount);
  const dayRemaining = Math.max(0, DAILY_LIMIT - record.dayCount);

  // Check limits
  if (record.hourCount >= HOURLY_LIMIT) {
    store.set(key, record);
    return {
      allowed: false,
      remaining: { hour: 0, day: dayRemaining },
      resetIn: {
        hour: Math.ceil((record.hourResetAt - now) / 1000),
        day: Math.ceil((record.dayResetAt - now) / 1000),
      },
      reason: "Too many submissions. Please try again later.",
    };
  }

  if (record.dayCount >= DAILY_LIMIT) {
    store.set(key, record);
    return {
      allowed: false,
      remaining: { hour: hourRemaining, day: 0 },
      resetIn: {
        hour: Math.ceil((record.hourResetAt - now) / 1000),
        day: Math.ceil((record.dayResetAt - now) / 1000),
      },
      reason: "Daily submission limit reached. Please try again tomorrow.",
    };
  }

  // Allowed - increment counters
  record.hourCount++;
  record.dayCount++;
  store.set(key, record);

  return {
    allowed: true,
    remaining: {
      hour: Math.max(0, HOURLY_LIMIT - record.hourCount),
      day: Math.max(0, DAILY_LIMIT - record.dayCount),
    },
    resetIn: {
      hour: Math.ceil((record.hourResetAt - now) / 1000),
      day: Math.ceil((record.dayResetAt - now) / 1000),
    },
  };
}

/**
 * Get rate limit status without incrementing counters.
 * Useful for checking before starting a submission process.
 */
export function getRateLimitStatus(ip: string, namespace: string = "default"): Omit<RateLimitResult, "reason"> & { allowed: boolean } {
  const now = Date.now();
  const key = `${namespace}:${ip}`;
  const record = store.get(key);

  if (!record) {
    return {
      allowed: true,
      remaining: { hour: HOURLY_LIMIT, day: DAILY_LIMIT },
      resetIn: { hour: 3600, day: 86400 },
    };
  }

  // Check if counters have reset
  const hourCount = now >= record.hourResetAt ? 0 : record.hourCount;
  const dayCount = now >= record.dayResetAt ? 0 : record.dayCount;

  const hourRemaining = Math.max(0, HOURLY_LIMIT - hourCount);
  const dayRemaining = Math.max(0, DAILY_LIMIT - dayCount);

  return {
    allowed: hourCount < HOURLY_LIMIT && dayCount < DAILY_LIMIT,
    remaining: { hour: hourRemaining, day: dayRemaining },
    resetIn: {
      hour: Math.ceil((record.hourResetAt - now) / 1000),
      day: Math.ceil((record.dayResetAt - now) / 1000),
    },
  };
}

/**
 * Clear rate limit for an IP (for testing/admin purposes)
 */
export function clearRateLimit(ip: string, namespace: string = "default"): void {
  store.delete(`${namespace}:${ip}`);
}
