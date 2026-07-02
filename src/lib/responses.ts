import { NextResponse } from "next/server";

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function unauthorized() {
  return NextResponse.json({ error: "Authentication required" }, { status: 401 });
}

export function serverError(error: unknown) {
  console.error(error);
  return NextResponse.json(
    { error: "Something went wrong. Check server logs for details." },
    { status: 500 },
  );
}
