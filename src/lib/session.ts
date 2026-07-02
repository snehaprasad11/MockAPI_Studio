import { cookies } from "next/headers";

import { readSessionToken, getSessionCookieName } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { mapUser } from "@/lib/mappers";
import type { User } from "@/lib/types";

type CurrentUserRow = {
  id: number;
  name: string;
  email: string;
  created_at: Date | string;
};

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  const userId = readSessionToken(token);

  if (!userId) return null;

  const row = await queryOne<CurrentUserRow>(
    `
      SELECT id, name, email, created_at
      FROM users
      WHERE id = :userId
    `,
    { userId },
  );

  return row ? mapUser(row) : null;
}
