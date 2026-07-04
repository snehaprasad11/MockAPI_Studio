# Architecture

MockAPI Studio is a Next.js full-stack app with server-rendered pages, client dashboard interactions, route-handler APIs, and MySQL persistence.

## Data Flow

```text
User -> Dashboard -> Next.js API routes -> MySQL
Frontend test app -> /api/mock/:workspace/:path -> Stored endpoint response -> Request log
Docs viewer -> /api/docs/:workspace/openapi -> Generated OpenAPI JSON
```

## Core Tables

- `users`: account identity and password hash.
- `workspaces`: user-owned API collections with public slugs and optional mock API-key metadata.
- `endpoints`: mock route definitions and JSON response bodies.
- `request_logs`: runtime calls made to public mock URLs.

## Runtime Mock Endpoint

The dynamic route:

```text
/api/mock/[workspaceSlug]/[...path]
```

matches incoming method and path against stored endpoint rows. If found, it returns the stored JSON response and writes a request log. If delay simulation is configured, the route waits before responding.

If API-key protection is enabled for a workspace, the runtime requires:

```text
x-mockapi-key: <generated key>
```

Only the key hash is stored in MySQL. The plaintext key is shown once after generation or rotation.

## Public Documentation

Each workspace gets a generated docs page at:

```text
/docs/[workspaceSlug]
```

The same workspace can also be exported as OpenAPI JSON:

```text
/api/docs/[workspaceSlug]/openapi
```

This makes the project useful for frontend testing and also easy to explain in interviews because the stored endpoint definitions become browsable documentation.

## Auth Model

Auth is intentionally simple and portfolio-friendly:

- Passwords are hashed with Node `crypto.scryptSync`.
- Sessions are signed with HMAC and stored in HTTP-only cookies.
- Dashboard APIs call `getCurrentUser()` before reading or writing user-owned data.

## Operational Hardening

- Non-destructive migrations live in `database/migrations`.
- Endpoint and request-log list APIs support `q`, `limit`, and `offset`.
- Login and registration are rate-limited per IP (5 attempts / 15 minutes) to slow brute-force attempts. The limiter is in-memory, so it resets on restart and only applies within a single server process.
- GitHub Actions runs typecheck, lint, tests, and production build on pushes and pull requests.

## Local LLM

The Ollama route is optional. It calls a local Ollama server and asks for JSON-only mock API data. No paid APIs are required.
