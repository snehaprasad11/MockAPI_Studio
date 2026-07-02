import { queryRows } from "@/lib/db";
import { mapRequestLog } from "@/lib/mappers";
import { serverError, unauthorized } from "@/lib/responses";
import { getCurrentUser } from "@/lib/session";

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

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { workspaceId } = await context.params;
    const rows = await queryRows<RequestLogRow>(
      `
        SELECT l.*
        FROM request_logs l
        JOIN workspaces w ON w.slug = l.workspace_slug
        WHERE w.id = :workspaceId
          AND w.user_id = :userId
        ORDER BY l.created_at DESC
        LIMIT 50
      `,
      { workspaceId: Number(workspaceId), userId: user.id },
    );

    return Response.json({ logs: rows.map(mapRequestLog) });
  } catch (error) {
    return serverError(error);
  }
}
