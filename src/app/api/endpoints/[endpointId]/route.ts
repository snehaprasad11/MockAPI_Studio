import { execute } from "@/lib/db";
import { badRequest, serverError, unauthorized } from "@/lib/responses";
import { getCurrentUser } from "@/lib/session";
import { normalizeEndpointPath } from "@/lib/slug";
import { ensureObjectBody, isHttpMethod, parseDelay, parseStatusCode } from "@/lib/validation";

type RouteContext = {
  params: Promise<{
    endpointId: string;
  }>;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { endpointId } = await context.params;
    const body = ensureObjectBody(await request.json());
    const method = String(body.method ?? "GET").toUpperCase();
    const path = normalizeEndpointPath(String(body.path ?? ""));

    if (!isHttpMethod(method)) return badRequest("Unsupported HTTP method.");
    if (!path || path === "/") return badRequest("Endpoint path is required.");

    const result = await execute(
      `
        UPDATE endpoints e
        JOIN workspaces w ON w.id = e.workspace_id
        SET
          e.method = :method,
          e.path = :path,
          e.name = :name,
          e.description = :description,
          e.status_code = :statusCode,
          e.response_delay_ms = :responseDelayMs,
          e.response_body = :responseBody,
          e.error_enabled = :errorEnabled,
          e.error_status_code = :errorStatusCode,
          e.error_body = :errorBody
        WHERE e.id = :endpointId
          AND w.user_id = :userId
      `,
      {
        endpointId: Number(endpointId),
        userId: user.id,
        method,
        path,
        name: String(body.name ?? "").trim() || `${method} ${path}`,
        description: String(body.description ?? "").trim() || null,
        statusCode: parseStatusCode(body.statusCode, 200),
        responseDelayMs: parseDelay(body.responseDelayMs),
        responseBody: JSON.stringify(body.responseBody ?? {}),
        errorEnabled: Boolean(body.errorEnabled),
        errorStatusCode: parseStatusCode(body.errorStatusCode, 500),
        errorBody: JSON.stringify(body.errorBody ?? { error: "Mock error" }),
      },
    );

    if (result.affectedRows === 0) return badRequest("Endpoint not found.");
    return Response.json({ ok: true });
  } catch (error) {
    if (isDuplicateEntry(error)) {
      return badRequest("An endpoint with this method and path already exists in this workspace.");
    }
    if (error instanceof Error) return badRequest(error.message);
    return serverError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { endpointId } = await context.params;
    const result = await execute(
      `
        DELETE e
        FROM endpoints e
        JOIN workspaces w ON w.id = e.workspace_id
        WHERE e.id = :endpointId
          AND w.user_id = :userId
      `,
      { endpointId: Number(endpointId), userId: user.id },
    );

    if (result.affectedRows === 0) return badRequest("Endpoint not found.");
    return Response.json({ ok: true });
  } catch (error) {
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
