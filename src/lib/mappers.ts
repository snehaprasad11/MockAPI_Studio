import type { MockEndpoint, RequestLog, User, Workspace } from "@/lib/types";

type UserRow = {
  id: number;
  name: string;
  email: string;
  created_at: Date | string;
};

type WorkspaceRow = {
  id: number;
  user_id: number;
  name: string;
  slug: string;
  description: string | null;
  api_key_enabled?: 0 | 1 | boolean;
  api_key_prefix?: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type EndpointRow = {
  id: number;
  workspace_id: number;
  method: MockEndpoint["method"];
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

export function mapUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: toIso(row.created_at),
  };
}

export function mapWorkspace(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    apiKeyEnabled: Boolean(row.api_key_enabled),
    apiKeyPrefix: row.api_key_prefix ?? null,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export function mapEndpoint(row: EndpointRow): MockEndpoint {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    method: row.method,
    path: row.path,
    name: row.name,
    description: row.description,
    statusCode: row.status_code,
    responseDelayMs: row.response_delay_ms,
    responseBody: parseJsonValue(row.response_body),
    errorEnabled: Boolean(row.error_enabled),
    errorStatusCode: row.error_status_code,
    errorBody: parseJsonValue(row.error_body),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export function mapRequestLog(row: RequestLogRow): RequestLog {
  return {
    id: row.id,
    endpointId: row.endpoint_id,
    workspaceSlug: row.workspace_slug,
    method: row.method,
    path: row.path,
    statusCode: row.status_code,
    requestBody: parseJsonValue(row.request_body),
    responseBody: parseJsonValue(row.response_body),
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    createdAt: toIso(row.created_at),
  };
}

export function parseJsonValue(value: unknown) {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function toIso(value: Date | string) {
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}
