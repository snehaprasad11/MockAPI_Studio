import { afterEach, describe, expect, it, vi } from "vitest";

const createPoolMock = vi.fn<(config: Record<string, unknown>) => object>(() => ({}));

vi.mock("mysql2/promise", () => ({
  default: { createPool: (config: Record<string, unknown>) => createPoolMock(config) },
}));

describe("getPool", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    createPoolMock.mockClear();
  });

  it("does not enable SSL by default", async () => {
    const { getPool } = await import("./db");
    getPool();

    expect(createPoolMock.mock.calls[0][0].ssl).toBeUndefined();
  });

  it("enables SSL when DATABASE_SSL is 'true'", async () => {
    vi.stubEnv("DATABASE_SSL", "true");
    const { getPool } = await import("./db");
    getPool();

    expect(createPoolMock.mock.calls[0][0].ssl).toEqual({ minVersion: "TLSv1.2" });
  });

  it("tolerates surrounding whitespace and casing in DATABASE_SSL", async () => {
    vi.stubEnv("DATABASE_SSL", " TRUE \n");
    const { getPool } = await import("./db");
    getPool();

    expect(createPoolMock.mock.calls[0][0].ssl).toEqual({ minVersion: "TLSv1.2" });
  });
});
