import { afterEach, describe, expect, it, vi } from "vitest";

const getCurrentUserMock = vi.fn();
const executeMock = vi.fn();

vi.mock("@/lib/session", () => ({
  getCurrentUser: () => getCurrentUserMock(),
}));

vi.mock("@/lib/db", () => ({
  execute: (...args: unknown[]) => executeMock(...args),
}));

import { DELETE } from "./route";

function context(workspaceId: string) {
  return { params: Promise.resolve({ workspaceId }) };
}

describe("DELETE /api/workspaces/:id", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated requests", async () => {
    getCurrentUserMock.mockResolvedValueOnce(null);

    const response = await DELETE(new Request("http://localhost/api/workspaces/1"), context("1"));

    expect(response.status).toBe(401);
    expect(executeMock).not.toHaveBeenCalled();
  });

  it("deletes a workspace owned by the current user", async () => {
    getCurrentUserMock.mockResolvedValueOnce({ id: 9 });
    executeMock.mockResolvedValueOnce({ affectedRows: 1 });

    const response = await DELETE(new Request("http://localhost/api/workspaces/1"), context("1"));

    expect(response.status).toBe(200);
    expect(executeMock.mock.calls[0][1]).toMatchObject({ workspaceId: 1, userId: 9 });
  });

  it("returns 400 when the workspace does not belong to the current user", async () => {
    getCurrentUserMock.mockResolvedValueOnce({ id: 9 });
    executeMock.mockResolvedValueOnce({ affectedRows: 0 });

    const response = await DELETE(new Request("http://localhost/api/workspaces/1"), context("1"));

    expect(response.status).toBe(400);
  });
});
