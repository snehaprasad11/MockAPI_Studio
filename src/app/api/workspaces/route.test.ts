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

function createRequest(body: unknown) {
  return new Request("http://localhost/api/workspaces", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("workspaces API", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated GET requests", async () => {
    getCurrentUserMock.mockResolvedValueOnce(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("creates a workspace", async () => {
    getCurrentUserMock.mockResolvedValueOnce({ id: 9 });
    queryOneMock.mockResolvedValueOnce({ count: 2 });
    executeMock.mockResolvedValueOnce({ insertId: 7 });

    const response = await POST(createRequest({ name: "Demo Store" }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toMatchObject({ id: 7, slug: "demo-store" });
  });

  it("rejects creating a workspace once the user hits their workspace limit", async () => {
    getCurrentUserMock.mockResolvedValueOnce({ id: 9 });
    queryOneMock.mockResolvedValueOnce({ count: 20 });

    const response = await POST(createRequest({ name: "One Too Many" }));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/at most 20 workspaces/);
    expect(executeMock).not.toHaveBeenCalled();
  });
});
