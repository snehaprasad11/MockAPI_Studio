import type { MockEndpoint, Workspace } from "@/lib/types";

export function EndpointList({
  endpoints,
  workspace,
  onTest,
  onEdit,
  onDelete,
  onCopy,
}: {
  endpoints: MockEndpoint[];
  workspace: Workspace;
  onTest: (endpoint: MockEndpoint) => void;
  onEdit: (endpoint: MockEndpoint) => void;
  onDelete: (endpoint: MockEndpoint) => void;
  onCopy: (endpoint: MockEndpoint) => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black">Endpoints</h2>
      <div className="mt-4 space-y-3">
        {endpoints.map((endpoint) => {
          const url = `/api/mock/${workspace.slug}${endpoint.path}`;
          return (
            <article
              key={endpoint.id}
              className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-slate-950 px-2 py-1 text-xs font-black text-white">
                    {endpoint.method}
                  </span>
                  <code className="text-sm font-black text-slate-800">{url}</code>
                </div>
                <p className="mt-2 text-sm font-bold text-slate-600">{endpoint.name}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onCopy(endpoint)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-black text-slate-700"
                >
                  Copy URL
                </button>
                <button
                  onClick={() => onEdit(endpoint)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-black text-slate-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => onTest(endpoint)}
                  className="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-sm font-black text-cyan-800"
                >
                  Test
                </button>
                <button
                  onClick={() => onDelete(endpoint)}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-black text-rose-700"
                >
                  Delete
                </button>
              </div>
            </article>
          );
        })}
        {endpoints.length === 0 ? (
          <p className="text-sm font-medium text-slate-500">No endpoints yet.</p>
        ) : null}
      </div>
    </section>
  );
}
