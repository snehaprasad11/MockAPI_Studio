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

export function parseStatusCode(value: unknown, fallback = 200) {
  const statusCode = Number(value ?? fallback);
  if (!Number.isInteger(statusCode) || statusCode < 100 || statusCode > 599) {
    throw new Error("Status code must be an integer between 100 and 599.");
  }

  return statusCode;
}

export function parseDelay(value: unknown) {
  const delay = Number(value ?? 0);
  if (!Number.isInteger(delay) || delay < 0 || delay > 10000) {
    throw new Error("Response delay must be an integer from 0 to 10000 ms.");
  }

  return delay;
}

export function parsePagination(url: URL) {
  const limit = Number(url.searchParams.get("limit") ?? 50);
  const offset = Number(url.searchParams.get("offset") ?? 0);

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("Limit must be an integer from 1 to 100.");
  }

  if (!Number.isInteger(offset) || offset < 0) {
    throw new Error("Offset must be a non-negative integer.");
  }

  return { limit, offset };
}

export function ensureObjectBody(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Request body must be a JSON object.");
  }

  return value as Record<string, unknown>;
}
