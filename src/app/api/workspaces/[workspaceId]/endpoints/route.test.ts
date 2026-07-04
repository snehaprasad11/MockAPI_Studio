import { afterEach, describe, expect, it, vi } from "vitest";

const getCurrentUserMock = vi.fn();
const queryOneMock = vi.fn();
const queryRowsMock = vi.fn();
const executeMock = vi.fn();

vi.mock("@/lib/session", () => ({
  getCurrentUser: () => getCurrentUserMock(),
}));

vi.mock("@/lib/db", () => ({
  queryOne: (...args: unknown[]) => queryOneMock(...args),
  queryRows: (...args: unknown[]) => queryRowsMock(...args),
  execute: (...args: unknown[]) => executeMock(...args),
}));

import { GET, POST } from "./route";

function context(workspaceId: string) {
  return { params: Promise.resolve({ workspaceId }) };
}

function createRequest(body: unknown) {
  return new Request("http://localhost/api/workspaces/1/endpoints", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("workspace endpoints API", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated GET requests", async () => {
    getCurrentUserMock.mockResolvedValueOnce(null);

    const response = await GET(new Request("http://localhost/api/workspaces/1/endpoints"), context("1"));

    expect(response.status).toBe(401);
    expect(queryRowsMock).not.toHaveBeenCalled();
  });

  it("lists endpoints scoped to the current user's workspace", async () => {
    getCurrentUserMock.mockResolvedValueOnce({ id: 9 });
    queryRowsMock.mockResolvedValueOnce([
      {
        id: 1,
        workspace_id: 1,
        method: "GET",
        path: "/products",
        name: "List products",
        description: null,
        status_code: 200,
        response_delay_ms: 0,
        response_body: "{}",
        error_enabled: 0,
        error_status_code: 500,
        error_body: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    const response = await GET(new Request("http://localhost/api/workspaces/1/endpoints"), context("1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.endpoints).toHaveLength(1);
    expect(body.endpoints[0].path).toBe("/products");
    expect(queryRowsMock.mock.calls[0][1]).toMatchObject({ workspaceId: 1, userId: 9 });
  });

  it("rejects unauthenticated POST requests", async () => {
    getCurrentUserMock.mockResolvedValueOnce(null);

    const response = await POST(createRequest({ method: "GET", path: "/products" }), context("1"));

    expect(response.status).toBe(401);
    expect(executeMock).not.toHaveBeenCalled();
  });

  it("creates an endpoint for the workspace", async () => {
    getCurrentUserMock.mockResolvedValueOnce({ id: 9 });
    queryOneMock.mockResolvedValueOnce({ count: 3 });
    executeMock.mockResolvedValueOnce({ affectedRows: 1, insertId: 5 });

    const response = await POST(
      createRequest({ method: "GET", path: "/products", responseBody: { ok: true } }),
      context("1"),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.id).toBe(5);
  });

  it("returns 400 when the workspace does not belong to the current user", async () => {
    getCurrentUserMock.mockResolvedValueOnce({ id: 9 });
    queryOneMock.mockResolvedValueOnce({ count: 0 });
    executeMock.mockResolvedValueOnce({ affectedRows: 0, insertId: 0 });

    const response = await POST(createRequest({ method: "GET", path: "/products" }), context("1"));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("Workspace not found.");
  });

  it("rejects creating an endpoint once the workspace hits its endpoint limit", async () => {
    getCurrentUserMock.mockResolvedValueOnce({ id: 9 });
    queryOneMock.mockResolvedValueOnce({ count: 100 });

    const response = await POST(createRequest({ method: "GET", path: "/products" }), context("1"));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/at most 100 endpoints/);
    expect(executeMock).not.toHaveBeenCalled();
  });
});
