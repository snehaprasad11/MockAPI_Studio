import Link from "next/link";

const features = [
  "Create workspaces for frontend projects",
  "Define fake REST endpoints with JSON responses",
  "Share public mock URLs with teammates",
  "Generate API docs and request logs automatically",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <nav className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-slate-950 text-sm font-black text-white">
              M
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-normal text-slate-950">
                MockAPI Studio
              </p>
              <p className="text-xs font-medium text-slate-500">
                Developer SaaS for mock REST APIs
              </p>
            </div>
          </div>
          <a
            href="/dashboard"
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
          >
            Open Studio
          </a>
        </nav>

        <div className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1.02fr_0.98fr]">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-sm font-bold text-cyan-800">
              Build fake APIs before the backend is ready
            </p>
            <h1 className="max-w-3xl text-5xl font-black leading-tight tracking-normal text-slate-950 md:text-6xl">
              Create mock endpoints, docs, and test links in one workspace.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              MockAPI Studio helps frontend developers prototype faster by
              storing reusable mock responses, exposing public test URLs, and
              generating docs from the endpoint configuration.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="rounded-lg bg-cyan-600 px-5 py-3 text-center text-sm font-black text-white shadow-sm transition hover:bg-cyan-700"
              >
                Start building
              </Link>
              <Link
                href="/docs/demo-store"
                className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-center text-sm font-black text-slate-800 transition hover:border-slate-400"
              >
                View sample docs
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-sm font-black text-slate-950">Endpoint preview</p>
                <p className="text-xs font-medium text-slate-500">
                  Public mock URL generated from stored JSON
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                200 OK
              </span>
            </div>
            <pre className="overflow-x-auto rounded-lg bg-slate-950 p-5 text-sm leading-6 text-slate-100">
{`GET /api/mock/demo-store/products

[
  {
    "id": 1,
    "name": "Launch Kit",
    "price": 49,
    "inStock": true
  }
]`}
            </pre>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {features.map((feature) => (
                <div key={feature} className="rounded-lg border border-slate-200 p-3">
                  <p className="text-sm font-bold text-slate-700">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </section>
    </main>
  );
}
