/**
 * Simple in-memory IP-based rate limiter.
 * Suitable for serverless (per-instance) limiting — not a distributed lock.
 * Primary purpose: slow down brute-force secret-key attacks on the postback endpoint.
 *
 * For production at scale, replace with Upstash Redis.
 */

interface BucketEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, BucketEntry>();

interface RateLimitOptions {
  /** Max requests per window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  ip: string,
  opts: RateLimitOptions = { limit: 60, windowMs: 60_000 }
): RateLimitResult {
  const now = Date.now();
  let entry = buckets.get(ip);

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + opts.windowMs };
    buckets.set(ip, entry);
  }

  entry.count += 1;

  // Prune stale entries to prevent unbounded memory growth
  if (buckets.size > 10_000) {
    for (const [key, val] of buckets) {
      if (now > val.resetAt) buckets.delete(key);
    }
  }

  return {
    allowed:   entry.count <= opts.limit,
    remaining: Math.max(0, opts.limit - entry.count),
    resetAt:   entry.resetAt,
  };
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
