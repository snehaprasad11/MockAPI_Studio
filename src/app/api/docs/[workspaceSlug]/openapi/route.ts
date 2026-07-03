import { queryOne, queryRows } from "@/lib/db";
import { mapEndpoint, mapWorkspace } from "@/lib/mappers";
import { buildOpenApiDocument } from "@/lib/openapi";
import type { HttpMethod } from "@/lib/types";

type RouteContext = {
  params: Promise<{
    workspaceSlug: string;
  }>;
};

type WorkspaceRow = {
  id: number;
  user_id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type EndpointRow = {
  id: number;
  workspace_id: number;
  method: HttpMethod;
  path: string;
  name: string;
  description: string | null;
  status_code: number;
  response_delay_ms: number;
  response_body: unknown;
  error_enabled: 0 | 1 | boolean;
  error_status_code: number;
  error_body: unknown | null;
  created_at: Date | string;
  updated_at: Date | string;
};

export async function GET(request: Request, context: RouteContext) {
  const { workspaceSlug } = await context.params;
  const workspaceRow = await queryOne<WorkspaceRow>(
    `
      SELECT id, user_id, name, slug, description, created_at, updated_at
      FROM workspaces
      WHERE slug = :workspaceSlug
    `,
    { workspaceSlug },
  );

  if (!workspaceRow) {
    return Response.json({ error: "Workspace not found." }, { status: 404 });
  }

  const workspace = mapWorkspace(workspaceRow);
  const endpointRows = await queryRows<EndpointRow>(
    `
      SELECT *
      FROM endpoints
      WHERE workspace_id = :workspaceId
      ORDER BY method, path
    `,
    { workspaceId: workspace.id },
  );

  const baseUrl = new URL(request.url).origin;
  const document = buildOpenApiDocument(workspace, endpointRows.map(mapEndpoint), baseUrl);

  return Response.json(document, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
