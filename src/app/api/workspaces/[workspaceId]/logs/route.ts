import { queryRows } from "@/lib/db";
import { mapRequestLog } from "@/lib/mappers";
import { badRequest, serverError, unauthorized } from "@/lib/responses";
import { getCurrentUser } from "@/lib/session";
import { parsePagination } from "@/lib/validation";

type RequestLogRow = {
  id: number;
  endpoint_id: number | null;
  workspace_slug: string;
  method: string;
  path: string;
  status_code: number;
  request_body: unknown | null;
  response_body: unknown | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date | string;
};

type RouteContext = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { workspaceId } = await context.params;
    const url = new URL(request.url);
    const { limit, offset } = parsePagination(url);
    const search = String(url.searchParams.get("q") ?? "").trim();
    const rows = await queryRows<RequestLogRow>(
      `
        SELECT l.*
        FROM request_logs l
        JOIN workspaces w ON w.slug = l.workspace_slug
        WHERE w.id = :workspaceId
          AND w.user_id = :userId
          AND (
            :search = ''
            OR l.method LIKE :searchLike
            OR l.path LIKE :searchLike
            OR CAST(l.status_code AS CHAR) LIKE :searchLike
        )
        ORDER BY l.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      {
        workspaceId: Number(workspaceId),
        userId: user.id,
        search,
        searchLike: `%${search}%`,
      },
    );

    return Response.json({ logs: rows.map(mapRequestLog), meta: { limit, offset } });
  } catch (error) {
    if (error instanceof Error) return badRequest(error.message);
    return serverError(error);
  }
}
