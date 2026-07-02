export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type User = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
};

export type Workspace = {
  id: number;
  userId: number;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MockEndpoint = {
  id: number;
  workspaceId: number;
  method: HttpMethod;
  path: string;
  name: string;
  description: string | null;
  statusCode: number;
  responseDelayMs: number;
  responseBody: unknown;
  errorEnabled: boolean;
  errorStatusCode: number;
  errorBody: unknown | null;
  createdAt: string;
  updatedAt: string;
};

export type RequestLog = {
  id: number;
  endpointId: number | null;
  workspaceSlug: string;
  method: string;
  path: string;
  statusCode: number;
  requestBody: unknown | null;
  responseBody: unknown | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};
