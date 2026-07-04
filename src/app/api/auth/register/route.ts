import { NextResponse } from "next/server";

import { createSessionToken, getSessionCookieName, hashPassword } from "@/lib/auth";
import { execute, queryOne } from "@/lib/db";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";
import { badRequest, serverError, tooManyRequests } from "@/lib/responses";
import { ensureObjectBody } from "@/lib/validation";

type ExistingUserRow = {
  id: number;
};

const registerRateLimiter = createRateLimiter({ limit: 5, windowMs: 15 * 60 * 1000 });

export async function POST(request: Request) {
  try {
    const rateLimit = registerRateLimiter(clientIp(request));
    if (!rateLimit.allowed) return tooManyRequests(rateLimit.retryAfterSeconds);

    const body = ensureObjectBody(await request.json());
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!name || !email || password.length < 8) {
      return badRequest("Name, email, and an 8+ character password are required.");
    }

    const existing = await queryOne<ExistingUserRow>(
      "SELECT id FROM users WHERE email = :email",
      { email },
    );

    if (existing) return badRequest("An account with this email already exists.");

    const result = await execute(
      `
        INSERT INTO users (name, email, password_hash)
        VALUES (:name, :email, :passwordHash)
      `,
      { name, email, passwordHash: hashPassword(password) },
    );

    const response = NextResponse.json({ ok: true });
    response.cookies.set(getSessionCookieName(), createSessionToken(result.insertId), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    if (error instanceof Error) return badRequest(error.message);
    return serverError(error);
  }
}
