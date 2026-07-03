import { execute, queryRows } from "@/lib/db";
import { mapWorkspace } from "@/lib/mappers";
import { badRequest, serverError, unauthorized } from "@/lib/responses";
import { getCurrentUser } from "@/lib/session";
import { slugify } from "@/lib/slug";
import { ensureObjectBody } from "@/lib/validation";

type WorkspaceRow = {
  id: number;
  user_id: number;
  name: string;
  slug: string;
  description: string | null;
  api_key_enabled: 0 | 1 | boolean;
  api_key_prefix: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const rows = await queryRows<WorkspaceRow>(
      `
        SELECT
          id,
          user_id,
          name,
          slug,
          description,
          api_key_enabled,
          api_key_prefix,
          created_at,
          updated_at
        FROM workspaces
        WHERE user_id = :userId
        ORDER BY updated_at DESC
      `,
      { userId: user.id },
    );

    return Response.json({ workspaces: rows.map(mapWorkspace) });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = ensureObjectBody(await request.json());
    const name = String(body.name ?? "").trim();
    const description = String(body.description ?? "").trim() || null;
    const slug = slugify(String(body.slug ?? name));

    if (!name || !slug) return badRequest("Workspace name is required.");

    const result = await execute(
      `
        INSERT INTO workspaces (user_id, name, slug, description)
        VALUES (:userId, :name, :slug, :description)
      `,
      { userId: user.id, name, slug, description },
    );

    return Response.json({ id: result.insertId, slug }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) return badRequest(error.message);
    return serverError(error);
  }
}
