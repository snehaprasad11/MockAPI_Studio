import { describe, expect, it } from "vitest";

import { isHttpMethod, parseDelay, parseJsonInput, parseStatusCode } from "./validation";

describe("validation helpers", () => {
  it("accepts supported HTTP methods only", () => {
    expect(isHttpMethod("GET")).toBe(true);
    expect(isHttpMethod("PATCH")).toBe(true);
    expect(isHttpMethod("TRACE")).toBe(false);
  });

  it("parses valid JSON input", () => {
    expect(parseJsonInput('{"ok":true}')).toEqual({ ok: true });
  });

  it("rejects invalid status codes and delays", () => {
    expect(() => parseStatusCode(99)).toThrow();
    expect(() => parseStatusCode(600)).toThrow();
    expect(() => parseDelay(-1)).toThrow();
    expect(() => parseDelay(10001)).toThrow();
  });
});
