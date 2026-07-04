import { verifyApiKey } from "@/lib/api-keys";
import { corsPreflight, withCors } from "@/lib/cors";
import { execute, queryOne } from "@/lib/db";
import { parseJsonValue } from "@/lib/mappers";

type EndpointRow = {
  id: number;
  api_key_enabled: 0 | 1 | boolean;
  api_key_hash: string | null;
  status_code: number;
  response_delay_ms: number;
  response_body: unknown;
  error_enabled: 0 | 1 | boolean;
  error_status_code: number;
  error_body: unknown | null;
};

type RouteContext = {
  params: Promise<{
    workspaceSlug: string;
    path: string[];
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  return handleMockRequest(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return handleMockRequest(request, context);
}

export async function PUT(request: Request, context: RouteContext) {
  return handleMockRequest(request, context);
}

export async function PATCH(request: Request, context: RouteContext) {
  return handleMockRequest(request, context);
}

export async function DELETE(request: Request, context: RouteContext) {
  return handleMockRequest(request, context);
}

export async function OPTIONS() {
  return corsPreflight();
}

async function handleMockRequest(request: Request, context: RouteContext) {
  const { workspaceSlug, path } = await context.params;
  const endpointPath = `/${path.join("/")}`;
  const method = request.method.toUpperCase();

  const endpoint = await queryOne<EndpointRow>(
    `
      SELECT
        e.id,
        w.api_key_enabled,
        w.api_key_hash,
        e.status_code,
        e.response_delay_ms,
        e.response_body,
        e.error_enabled,
        e.error_status_code,
        e.error_body
      FROM endpoints e
      JOIN workspaces w ON w.id = e.workspace_id
      WHERE w.slug = :workspaceSlug
        AND e.method = :method
        AND e.path = :endpointPath
    `,
    { workspaceSlug, method, endpointPath },
  );

  if (!endpoint) {
    return withCors(
      Response.json(
        {
          error: "Mock endpoint not found",
          route: `${method} /api/mock/${workspaceSlug}${endpointPath}`,
        },
        { status: 404 },
      ),
    );
  }

  if (Boolean(endpoint.api_key_enabled)) {
    const apiKey = request.headers.get("x-mockapi-key");
    if (!verifyApiKey(apiKey, endpoint.api_key_hash)) {
      await logRequest(request, {
        endpointId: endpoint.id,
        workspaceSlug,
        method,
        endpointPath,
        statusCode: 401,
        responseBody: { error: "Missing or invalid mock API key" },
      });

      return withCors(Response.json({ error: "Missing or invalid mock API key" }, { status: 401 }));
    }
  }

  if (endpoint.response_delay_ms > 0) {
    await new Promise((resolve) => setTimeout(resolve, endpoint.response_delay_ms));
  }

  const shouldReturnError = Boolean(endpoint.error_enabled);
  const statusCode = shouldReturnError ? endpoint.error_status_code : endpoint.status_code;
  const responseBody = shouldReturnError
    ? parseJsonValue(endpoint.error_body)
    : parseJsonValue(endpoint.response_body);

  await logRequest(request, {
    endpointId: endpoint.id,
    workspaceSlug,
    method,
    endpointPath,
    statusCode,
    responseBody,
  });

  return withCors(Response.json(responseBody, { status: statusCode }));
}

async function logRequest(
  request: Request,
  details: {
    endpointId: number;
    workspaceSlug: string;
    method: string;
    endpointPath: string;
    statusCode: number;
    responseBody: unknown;
  },
) {
  const requestBody = await readRequestBody(request);

  await execute(
    `
      INSERT INTO request_logs (
        endpoint_id,
        workspace_slug,
        method,
        path,
        status_code,
        request_body,
        response_body,
        ip_address,
        user_agent
      )
      VALUES (
        :endpointId,
        :workspaceSlug,
        :method,
        :endpointPath,
        :statusCode,
        :requestBody,
        :responseBody,
        :ipAddress,
        :userAgent
      )
    `,
    {
      endpointId: details.endpointId,
      workspaceSlug: details.workspaceSlug,
      method: details.method,
      endpointPath: details.endpointPath,
      statusCode: details.statusCode,
      requestBody: JSON.stringify(requestBody),
      responseBody: JSON.stringify(details.responseBody),
      ipAddress: request.headers.get("x-forwarded-for") ?? null,
      userAgent: request.headers.get("user-agent") ?? null,
    },
  );
}

async function readRequestBody(request: Request) {
  if (request.method === "GET" || request.method === "DELETE") return null;

  try {
    return await request.clone().json();
  } catch {
    return null;
  }
}
