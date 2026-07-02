import type { HttpMethod } from "@/lib/types";

export const httpMethods: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export function isHttpMethod(value: string): value is HttpMethod {
  return httpMethods.includes(value as HttpMethod);
}

export function parseJsonInput(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error("Response body must be valid JSON.");
  }
}

export function ensureObjectBody(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Request body must be a JSON object.");
  }

  return value as Record<string, unknown>;
}
