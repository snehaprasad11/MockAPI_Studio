# Architecture

MockAPI Studio is a Next.js full-stack app with server-rendered pages, client dashboard interactions, route-handler APIs, and MySQL persistence.

## Data Flow

```text
User -> Dashboard -> Next.js API routes -> MySQL
Frontend test app -> /api/mock/:workspace/:path -> Stored endpoint response -> Request log
```

## Core Tables

- `users`: account identity and password hash.
- `workspaces`: user-owned API collections with public slugs.
- `endpoints`: mock route definitions and JSON response bodies.
- `request_logs`: runtime calls made to public mock URLs.

## Runtime Mock Endpoint

The dynamic route:

```text
/api/mock/[workspaceSlug]/[...path]
```

matches incoming method and path against stored endpoint rows. If found, it returns the stored JSON response and writes a request log. If delay simulation is configured, the route waits before responding.

## Auth Model

Auth is intentionally simple and portfolio-friendly:

- Passwords are hashed with Node `crypto.scryptSync`.
- Sessions are signed with HMAC and stored in HTTP-only cookies.
- Dashboard APIs call `getCurrentUser()` before reading or writing user-owned data.

## Local LLM

The Ollama route is optional. It calls a local Ollama server and asks for JSON-only mock API data. No paid APIs are required.
