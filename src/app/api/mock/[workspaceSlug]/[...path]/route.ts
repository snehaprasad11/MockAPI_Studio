import { execute, queryOne } from "@/lib/db";
import { parseJsonValue } from "@/lib/mappers";

type EndpointRow = {
  id: number;
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

async function handleMockRequest(request: Request, context: RouteContext) {
  const { workspaceSlug, path } = await context.params;
  const endpointPath = `/${path.join("/")}`;
  const method = request.method.toUpperCase();

  const endpoint = await queryOne<EndpointRow>(
    `
      SELECT
        e.id,
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
    return Response.json(
      {
        error: "Mock endpoint not found",
        route: `${method} /api/mock/${workspaceSlug}${endpointPath}`,
      },
      { status: 404 },
    );
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

  return Response.json(responseBody, { status: statusCode });
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
        CAST(:requestBody AS JSON),
        CAST(:responseBody AS JSON),
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
