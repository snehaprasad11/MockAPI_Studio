import { afterEach, describe, expect, it, vi } from "vitest";

const queryOneMock = vi.fn();

vi.mock("@/lib/db", () => ({
  queryOne: (...args: unknown[]) => queryOneMock(...args),
}));

import { hashPassword } from "@/lib/auth";

import { POST } from "./route";

function loginRequest(body: unknown) {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("logs in with correct credentials", async () => {
    queryOneMock.mockResolvedValueOnce({ id: 7, password_hash: hashPassword("password123") });

    const response = await POST(loginRequest({ email: "sneha@example.com", password: "password123" }));

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("mockapi_session=");
  });

  it("rejects an incorrect password", async () => {
    queryOneMock.mockResolvedValueOnce({ id: 7, password_hash: hashPassword("password123") });

    const response = await POST(loginRequest({ email: "sneha@example.com", password: "wrong-password" }));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/Invalid email or password/);
  });

  it("rejects an email with no account", async () => {
    queryOneMock.mockResolvedValueOnce(null);

    const response = await POST(loginRequest({ email: "missing@example.com", password: "password123" }));

    expect(response.status).toBe(400);
  });
});
