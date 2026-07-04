// In-memory only: state resets on restart and isn't shared across instances.
// Fine for a single-process deployment; swap for Redis/Upstash to scale out.
type Bucket = {
  count: number;
  resetAt: number;
};

export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const buckets = new Map<string, Bucket>();

  return function check(key: string) {
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now >= bucket.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, retryAfterSeconds: 0 };
    }

    if (bucket.count >= limit) {
      return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
    }

    bucket.count += 1;
    return { allowed: true, retryAfterSeconds: 0 };
  };
}

export function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for") ?? "unknown";
}
