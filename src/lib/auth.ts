import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

const sessionCookie = "mockapi_session";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function createSessionToken(userId: number) {
  const payload = Buffer.from(
    JSON.stringify({ userId, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 }),
  ).toString("base64url");
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function readSessionToken(token: string | undefined) {
  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature || sign(payload) !== signature) return null;

  const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
    userId: number;
    exp: number;
  };

  if (!data.userId || Date.now() > data.exp) return null;
  return data.userId;
}

export function getSessionCookieName() {
  return sessionCookie;
}

function sign(payload: string) {
  const secret = process.env.SESSION_SECRET ?? "local-dev-secret-change-me";
  return createHmac("sha256", secret).update(payload).digest("base64url");
}
