import Link from "next/link";

import type { Workspace } from "@/lib/types";

export function WorkspaceOverview({
  workspace,
  metrics,
  onDelete,
}: {
  workspace: Workspace;
  metrics: {
    endpointCount: number;
    requestCount: number;
    successfulRequests: number;
    failedRequests: number;
    averageDelay: number;
    errorScenarioCount: number;
  };
  onDelete: () => void;
}) {
  const stats = [
    { label: "Endpoints", value: metrics.endpointCount },
    { label: "Recent requests", value: metrics.requestCount },
    { label: "Success logs", value: metrics.successfulRequests },
    { label: "Error logs", value: metrics.failedRequests },
    { label: "Avg delay", value: `${metrics.averageDelay} ms` },
    { label: "Error scenarios", value: metrics.errorScenarioCount },
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-black text-cyan-700">Workspace overview</p>
          <h2 className="mt-1 text-2xl font-black">{workspace.name}</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {workspace.description || "Mock API workspace for frontend development."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/docs/${workspace.slug}`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-black"
          >
            Docs
          </Link>
          <a
            href={`/api/docs/${workspace.slug}/openapi`}
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-black text-white"
          >
            OpenAPI
          </a>
          <button
            onClick={onDelete}
            className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-black text-rose-700"
          >
            Delete workspace
          </button>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-normal text-slate-500">
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-black text-slate-950">{stat.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ApiKeyPanel({
  apiKeyValue,
  onDisable,
  onEnable,
  onRotate,
  workspace,
}: {
  apiKeyValue: string;
  onDisable: () => void;
  onEnable: () => void;
  onRotate: () => void;
  workspace: Workspace;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-black text-cyan-700">Public endpoint security</p>
          <h2 className="mt-1 text-xl font-black">
            {workspace.apiKeyEnabled ? "API key protection enabled" : "Open mock endpoints"}
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Protect public mock URLs with the{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs text-slate-700">
              x-mockapi-key
            </code>{" "}
            header when a demo needs private access.
          </p>
          {workspace.apiKeyEnabled && workspace.apiKeyPrefix ? (
            <p className="mt-2 text-xs font-black uppercase tracking-normal text-slate-500">
              Active prefix: {workspace.apiKeyPrefix}...
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {workspace.apiKeyEnabled ? (
            <>
              <button
                onClick={onRotate}
                className="rounded-lg border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-black text-cyan-800"
              >
                Rotate key
              </button>
              <button
                onClick={onDisable}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-black"
              >
                Disable
              </button>
            </>
          ) : (
            <button
              onClick={onEnable}
              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-black text-white"
            >
              Enable API key
            </button>
          )}
        </div>
      </div>
      {apiKeyValue ? (
        <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm font-bold text-slate-100">
          {apiKeyValue}
        </pre>
      ) : null}
    </section>
  );
}
