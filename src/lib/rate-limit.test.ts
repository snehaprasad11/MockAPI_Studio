import { afterEach, describe, expect, it, vi } from "vitest";

import { clientIp, createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests under the limit and blocks beyond it", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 60_000 });

    expect(limiter("1.2.3.4").allowed).toBe(true);
    expect(limiter("1.2.3.4").allowed).toBe(true);

    const blocked = limiter("1.2.3.4");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("tracks separate keys independently", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });

    expect(limiter("a").allowed).toBe(true);
    expect(limiter("b").allowed).toBe(true);
    expect(limiter("a").allowed).toBe(false);
  });

  it("resets the window once it expires", () => {
    vi.useFakeTimers();
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });

    expect(limiter("a").allowed).toBe(true);
    expect(limiter("a").allowed).toBe(false);

    vi.advanceTimersByTime(1001);
    expect(limiter("a").allowed).toBe(true);
  });
});

describe("clientIp", () => {
  it("reads the x-forwarded-for header", () => {
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.5" },
    });

    expect(clientIp(request)).toBe("203.0.113.5");
  });

  it("falls back to 'unknown' when the header is missing", () => {
    expect(clientIp(new Request("http://localhost"))).toBe("unknown");
  });
});
