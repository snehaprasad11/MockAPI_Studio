import { describe, expect, it } from "vitest";

import { normalizeEndpointPath, slugify } from "./slug";

describe("slug helpers", () => {
  it("creates URL-safe workspace slugs", () => {
    expect(slugify("Demo Store API!!")).toBe("demo-store-api");
    expect(slugify("  Admin Panel  ")).toBe("admin-panel");
  });

  it("normalizes endpoint paths", () => {
    expect(normalizeEndpointPath("products")).toBe("/products");
    expect(normalizeEndpointPath("///orders//1001")).toBe("/orders/1001");
  });
});
