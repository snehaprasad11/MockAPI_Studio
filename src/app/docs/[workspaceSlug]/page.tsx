import { notFound } from "next/navigation";
import Link from "next/link";

import { queryRows, queryOne } from "@/lib/db";
import { mapEndpoint, mapWorkspace } from "@/lib/mappers";
import type { HttpMethod } from "@/lib/types";

type PageProps = {
  params: Promise<{
    workspaceSlug: string;
  }>;
};

type WorkspaceRow = {
  id: number;
  user_id: number;
  name: string;
  slug: string;
  description: string | null;
  api_key_enabled: 0 | 1 | boolean;
  api_key_prefix: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

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

export default async function PublicDocsPage({ params }: PageProps) {
  const { workspaceSlug } = await params;
  const workspaceRow = await queryOne<WorkspaceRow>(
    `
      SELECT
        id,
        user_id,
        name,
        slug,
        description,
        api_key_enabled,
        api_key_prefix,
        created_at,
        updated_at
      FROM workspaces
      WHERE slug = :workspaceSlug
    `,
    { workspaceSlug },
  );

  if (!workspaceRow) notFound();

  const workspace = mapWorkspace(workspaceRow);
  const endpointRows = await queryRows<EndpointRow>(
    `
      SELECT *
      FROM endpoints
      WHERE workspace_id = :workspaceId
      ORDER BY method, path
    `,
    { workspaceId: workspace.id },
  );
  const endpoints = endpointRows.map(mapEndpoint);

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-5 py-8 text-slate-950">
      <section className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-black text-cyan-700">
          MockAPI Studio
        </Link>
        <div className="mt-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-normal text-cyan-700">
                Public API docs
              </p>
              <h1 className="mt-2 text-4xl font-black tracking-normal">{workspace.name}</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                {workspace.description ||
                  "This workspace exposes mock API endpoints for frontend testing."}
              </p>
              {workspace.apiKeyEnabled ? (
                <p className="mt-3 text-sm font-bold text-cyan-700">
                  This workspace expects the `x-mockapi-key` header for public mock requests.
                </p>
              ) : null}
            </div>
            <a
              href={`/api/docs/${workspace.slug}/openapi`}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-800"
            >
              OpenAPI JSON
            </a>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {endpoints.map((endpoint) => {
            const mockUrl = `/api/mock/${workspace.slug}${endpoint.path}`;
            return (
              <article
                key={endpoint.id}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-slate-950 px-2 py-1 text-xs font-black text-white">
                        {endpoint.method}
                      </span>
                      <code className="text-sm font-black text-slate-800">{mockUrl}</code>
                    </div>
                    <h2 className="mt-3 text-xl font-black">{endpoint.name}</h2>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      {endpoint.description || "No description provided."}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                    {endpoint.statusCode}
                  </span>
                </div>
                <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm leading-6 text-slate-100">
                  {JSON.stringify(endpoint.responseBody, null, 2)}
                </pre>
                <div className="mt-4">
                  <p className="text-xs font-black uppercase tracking-normal text-slate-500">
                    Test command
                  </p>
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-100 p-4 text-sm font-bold text-slate-800">
                    {workspace.apiKeyEnabled
                      ? `curl -i -X ${endpoint.method} "${mockUrl}" -H "x-mockapi-key: YOUR_KEY"`
                      : `curl -i -X ${endpoint.method} "${mockUrl}"`}
                  </pre>
                </div>
              </article>
            );
          })}
          {endpoints.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
              <h2 className="text-xl font-black">No endpoints published yet</h2>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Add endpoints in the studio dashboard to generate docs here.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
