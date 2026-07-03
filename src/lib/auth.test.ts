import { describe, expect, it, vi } from "vitest";

import { createSessionToken, hashPassword, readSessionToken, verifyPassword } from "./auth";

describe("auth helpers", () => {
  it("hashes and verifies passwords", () => {
    const hash = hashPassword("password123");

    expect(verifyPassword("password123", hash)).toBe(true);
    expect(verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("creates signed session tokens", () => {
    vi.stubEnv("SESSION_SECRET", "test-secret");

    const token = createSessionToken(123);

    expect(readSessionToken(token)).toBe(123);
    expect(readSessionToken(`${token}tampered`)).toBeNull();
  });
});
