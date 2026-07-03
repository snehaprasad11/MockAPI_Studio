import { describe, expect, it } from "vitest";

import { createApiKey, getApiKeyPrefix, hashApiKey, verifyApiKey } from "./api-keys";

describe("api key helpers", () => {
  it("creates prefixed keys and verifies only matching hashes", () => {
    const apiKey = createApiKey();
    const hash = hashApiKey(apiKey);

    expect(apiKey.startsWith("mk_live_")).toBe(true);
    expect(getApiKeyPrefix(apiKey)).toBe(apiKey.slice(0, 16));
    expect(verifyApiKey(apiKey, hash)).toBe(true);
    expect(verifyApiKey("mk_live_wrong", hash)).toBe(false);
  });
});
