import { describe, expect, it } from "vitest";

import { buildOpenApiDocument } from "./openapi";
import type { MockEndpoint, Workspace } from "./types";

const workspace: Workspace = {
  id: 1,
  userId: 1,
  name: "Demo Store",
  slug: "demo-store",
  description: "Mock ecommerce endpoints.",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const endpoint: MockEndpoint = {
  id: 1,
  workspaceId: 1,
  method: "GET",
  path: "/products",
  name: "List products",
  description: "Returns product cards.",
  statusCode: 200,
  responseDelayMs: 0,
  responseBody: [{ id: 1, name: "Launch Kit" }],
  errorEnabled: false,
  errorStatusCode: 500,
  errorBody: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("buildOpenApiDocument", () => {
  it("generates an OpenAPI document from workspace endpoints", () => {
    const document = buildOpenApiDocument(workspace, [endpoint], "http://localhost:3000");

    expect(document.info.title).toBe("Demo Store Mock API");
    expect(document.servers[0].url).toBe("http://localhost:3000/api/mock/demo-store");
    expect(document.paths["/products"]?.get?.summary).toBe("List products");
    expect(document.paths["/products"]?.get?.responses["200"].content["application/json"].example).toEqual([
      { id: 1, name: "Launch Kit" },
    ]);
  });
});
