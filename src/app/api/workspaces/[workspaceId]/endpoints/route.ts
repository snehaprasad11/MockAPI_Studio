import { execute, queryOne, queryRows } from "@/lib/db";
import { MAX_ENDPOINTS_PER_WORKSPACE } from "@/lib/limits";
import { mapEndpoint } from "@/lib/mappers";
import { badRequest, serverError, unauthorized } from "@/lib/responses";
import { getCurrentUser } from "@/lib/session";
import { normalizeEndpointPath } from "@/lib/slug";
import type { HttpMethod } from "@/lib/types";
import {
  ensureObjectBody,
  isHttpMethod,
  parseDelay,
  parsePagination,
  parseStatusCode,
} from "@/lib/validation";

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
    const methodFilter = String(url.searchParams.get("method") ?? "").toUpperCase();

    if (methodFilter && !isHttpMethod(methodFilter)) {
      return badRequest("Unsupported HTTP method filter.");
    }

    const rows = await queryRows<EndpointRow>(
      `
        SELECT e.*
        FROM endpoints e
        JOIN workspaces w ON w.id = e.workspace_id
        WHERE e.workspace_id = :workspaceId
          AND w.user_id = :userId
          AND (:methodFilter = '' OR e.method = :methodFilter)
          AND (
            :search = ''
            OR e.path LIKE :searchLike
            OR e.name LIKE :searchLike
            OR e.description LIKE :searchLike
        )
        ORDER BY e.updated_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      {
        workspaceId: Number(workspaceId),
        userId: user.id,
        methodFilter,
        search,
        searchLike: `%${search}%`,
      },
    );

    return Response.json({ endpoints: rows.map(mapEndpoint), meta: { limit, offset } });
  } catch (error) {
    if (error instanceof Error) return badRequest(error.message);
    return serverError(error);
  }
}

function isDuplicateEntry(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ER_DUP_ENTRY"
  );
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { workspaceId } = await context.params;
    const body = ensureObjectBody(await request.json());
    const method = String(body.method ?? "GET").toUpperCase();
    const path = normalizeEndpointPath(String(body.path ?? ""));
    const name = String(body.name ?? "").trim() || `${method} ${path}`;
    const description = String(body.description ?? "").trim() || null;
    const statusCode = parseStatusCode(body.statusCode, 200);
    const responseDelayMs = parseDelay(body.responseDelayMs);
    const responseBody = JSON.stringify(body.responseBody ?? {});
    const errorEnabled = Boolean(body.errorEnabled);
    const errorStatusCode = parseStatusCode(body.errorStatusCode, 500);
    const errorBody = JSON.stringify(body.errorBody ?? { error: "Mock error" });

    if (!isHttpMethod(method)) return badRequest("Unsupported HTTP method.");
    if (!path || path === "/") return badRequest("Endpoint path is required.");

    const { count } =
      (await queryOne<{ count: number }>(
        "SELECT COUNT(*) as count FROM endpoints WHERE workspace_id = :workspaceId",
        { workspaceId: Number(workspaceId) },
      )) ?? { count: 0 };

    if (Number(count) >= MAX_ENDPOINTS_PER_WORKSPACE) {
      return badRequest(`A workspace can have at most ${MAX_ENDPOINTS_PER_WORKSPACE} endpoints.`);
    }

    const result = await execute(
      `
        INSERT INTO endpoints (
          workspace_id,
          method,
          path,
          name,
          description,
          status_code,
          response_delay_ms,
          response_body,
          error_enabled,
          error_status_code,
          error_body
        )
        SELECT
          w.id,
          :method,
          :path,
          :name,
          :description,
          :statusCode,
          :responseDelayMs,
          :responseBody,
          :errorEnabled,
          :errorStatusCode,
          :errorBody
        FROM workspaces w
        WHERE w.id = :workspaceId
          AND w.user_id = :userId
      `,
      {
        workspaceId: Number(workspaceId),
        userId: user.id,
        method,
        path,
        name,
        description,
        statusCode,
        responseDelayMs,
        responseBody,
        errorEnabled,
        errorStatusCode,
        errorBody,
      },
    );

    if (result.affectedRows === 0) return badRequest("Workspace not found.");
    return Response.json({ id: result.insertId }, { status: 201 });
  } catch (error) {
    if (isDuplicateEntry(error)) {
      return badRequest("An endpoint with this method and path already exists in this workspace.");
    }
    if (error instanceof Error) return badRequest(error.message);
    return serverError(error);
  }
}
