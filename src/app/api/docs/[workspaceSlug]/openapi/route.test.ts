import { afterEach, describe, expect, it, vi } from "vitest";

const queryOneMock = vi.fn();
const queryRowsMock = vi.fn();

vi.mock("@/lib/db", () => ({
  queryOne: (...args: unknown[]) => queryOneMock(...args),
  queryRows: (...args: unknown[]) => queryRowsMock(...args),
}));

import { GET, OPTIONS } from "./route";

function context(workspaceSlug: string) {
  return { params: Promise.resolve({ workspaceSlug }) };
}

describe("GET /api/docs/:workspaceSlug/openapi", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when the workspace does not exist", async () => {
    queryOneMock.mockResolvedValueOnce(null);

    const response = await GET(
      new Request("http://localhost/api/docs/missing/openapi"),
      context("missing"),
    );

    expect(response.status).toBe(404);
  });

  it("builds an OpenAPI document with CORS headers so any tool can fetch it", async () => {
    queryOneMock.mockResolvedValueOnce({
      id: 1,
      user_id: 9,
      name: "Demo Store",
      slug: "demo-store",
      description: null,
      api_key_enabled: 0,
      api_key_prefix: null,
      created_at: new Date(),
      updated_at: new Date(),
    });
    queryRowsMock.mockResolvedValueOnce([]);

    const response = await GET(
      new Request("http://localhost/api/docs/demo-store/openapi"),
      context("demo-store"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.info.title).toContain("Demo Store");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("responds to CORS preflight requests", async () => {
    const response = await OPTIONS();

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});
