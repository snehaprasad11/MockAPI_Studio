import { afterEach, describe, expect, it, vi } from "vitest";

const queryOneMock = vi.fn();
const executeMock = vi.fn();

vi.mock("@/lib/db", () => ({
  queryOne: (...args: unknown[]) => queryOneMock(...args),
  execute: (...args: unknown[]) => executeMock(...args),
}));

import { hashApiKey } from "@/lib/api-keys";

import { GET } from "./route";

function context(workspaceSlug: string, path: string[]) {
  return { params: Promise.resolve({ workspaceSlug, path }) };
}

describe("GET /api/mock/:workspaceSlug/:path", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when no mock endpoint matches", async () => {
    queryOneMock.mockResolvedValueOnce(null);

    const response = await GET(
      new Request("http://localhost/api/mock/demo-store/missing"),
      context("demo-store", ["missing"]),
    );

    expect(response.status).toBe(404);
    expect((await response.json()).error).toBe("Mock endpoint not found");
  });

  it("returns the stored response and logs the request", async () => {
    queryOneMock.mockResolvedValueOnce({
      id: 1,
      api_key_enabled: 0,
      api_key_hash: null,
      status_code: 201,
      response_delay_ms: 0,
      response_body: JSON.stringify({ ok: true }),
      error_enabled: 0,
      error_status_code: 500,
      error_body: null,
    });
    executeMock.mockResolvedValueOnce({ insertId: 1 });

    const response = await GET(
      new Request("http://localhost/api/mock/demo-store/products"),
      context("demo-store", ["products"]),
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ ok: true });
    expect(executeMock).toHaveBeenCalledTimes(1);
    expect(executeMock.mock.calls[0][1]).toMatchObject({ statusCode: 201 });
  });

  it("returns the error response when error simulation is enabled", async () => {
    queryOneMock.mockResolvedValueOnce({
      id: 2,
      api_key_enabled: 0,
      api_key_hash: null,
      status_code: 200,
      response_delay_ms: 0,
      response_body: JSON.stringify({ ok: true }),
      error_enabled: 1,
      error_status_code: 503,
      error_body: JSON.stringify({ error: "Service unavailable" }),
    });
    executeMock.mockResolvedValueOnce({ insertId: 2 });

    const response = await GET(
      new Request("http://localhost/api/mock/demo-store/flaky"),
      context("demo-store", ["flaky"]),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Service unavailable" });
  });

  it("rejects requests without a valid API key when protection is enabled", async () => {
    queryOneMock.mockResolvedValueOnce({
      id: 3,
      api_key_enabled: 1,
      api_key_hash: hashApiKey("mk_live_real-key"),
      status_code: 200,
      response_delay_ms: 0,
      response_body: JSON.stringify({ ok: true }),
      error_enabled: 0,
      error_status_code: 500,
      error_body: null,
    });
    executeMock.mockResolvedValueOnce({ insertId: 3 });

    const response = await GET(
      new Request("http://localhost/api/mock/demo-store/secure"),
      context("demo-store", ["secure"]),
    );

    expect(response.status).toBe(401);
  });

  it("accepts requests with a valid API key", async () => {
    queryOneMock.mockResolvedValueOnce({
      id: 4,
      api_key_enabled: 1,
      api_key_hash: hashApiKey("mk_live_real-key"),
      status_code: 200,
      response_delay_ms: 0,
      response_body: JSON.stringify({ ok: true }),
      error_enabled: 0,
      error_status_code: 500,
      error_body: null,
    });
    executeMock.mockResolvedValueOnce({ insertId: 4 });

    const response = await GET(
      new Request("http://localhost/api/mock/demo-store/secure", {
        headers: { "x-mockapi-key": "mk_live_real-key" },
      }),
      context("demo-store", ["secure"]),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});
