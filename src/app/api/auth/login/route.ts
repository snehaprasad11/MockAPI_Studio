import { NextResponse } from "next/server";

import { createSessionToken, getSessionCookieName, verifyPassword } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { badRequest, serverError } from "@/lib/responses";
import { ensureObjectBody } from "@/lib/validation";

type LoginUserRow = {
  id: number;
  password_hash: string;
};

export async function POST(request: Request) {
  try {
    const body = ensureObjectBody(await request.json());
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) return badRequest("Email and password are required.");

    const user = await queryOne<LoginUserRow>(
      "SELECT id, password_hash FROM users WHERE email = :email",
      { email },
    );

    if (!user || !verifyPassword(password, user.password_hash)) {
      return badRequest("Invalid email or password.");
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(getSessionCookieName(), createSessionToken(user.id), {
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
