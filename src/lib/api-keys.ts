import { createHash, randomBytes, timingSafeEqual } from "crypto";

const keyPrefix = "mk_live";

export function createApiKey() {
  return `${keyPrefix}_${randomBytes(24).toString("base64url")}`;
}

export function getApiKeyPrefix(apiKey: string) {
  return apiKey.slice(0, 16);
}

export function hashApiKey(apiKey: string) {
  return createHash("sha256").update(apiKey).digest("hex");
}

export function verifyApiKey(apiKey: string | null, storedHash: string | null) {
  if (!apiKey || !storedHash) return false;

  const candidate = Buffer.from(hashApiKey(apiKey), "hex");
  const expected = Buffer.from(storedHash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}
