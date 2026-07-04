import { afterEach, describe, expect, it, vi } from "vitest";

const queryOneMock = vi.fn();
const executeMock = vi.fn();

vi.mock("@/lib/db", () => ({
  queryOne: (...args: unknown[]) => queryOneMock(...args),
  execute: (...args: unknown[]) => executeMock(...args),
}));

import { POST } from "./route";

function registerRequest(body: unknown) {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/register", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("rejects passwords shorter than 8 characters", async () => {
    const response = await POST(
      registerRequest({ name: "Sneha", email: "sneha@example.com", password: "short" }),
    );

    expect(response.status).toBe(400);
    expect(queryOneMock).not.toHaveBeenCalled();
  });

  it("rejects an email that already has an account", async () => {
    queryOneMock.mockResolvedValueOnce({ id: 1 });

    const response = await POST(
      registerRequest({ name: "Sneha", email: "sneha@example.com", password: "password123" }),
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/already exists/);
    expect(executeMock).not.toHaveBeenCalled();
  });

  it("creates a user and sets a session cookie", async () => {
    queryOneMock.mockResolvedValueOnce(null);
    executeMock.mockResolvedValueOnce({ insertId: 42 });

    const response = await POST(
      registerRequest({ name: "Sneha", email: "sneha@example.com", password: "password123" }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("mockapi_session=");
  });
});
