"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { HttpMethod, MockEndpoint, RequestLog, User, Workspace } from "@/lib/types";

const starterJson = `{
  "id": 1,
  "name": "Launch Kit",
  "price": 49,
  "inStock": true
}`;

type ApiState = "idle" | "loading" | "error" | "success";

export function StudioClient() {
  const [user, setUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null);
  const [endpoints, setEndpoints] = useState<MockEndpoint[]>([]);
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [status, setStatus] = useState<ApiState>("idle");
  const [message, setMessage] = useState("");
  const [testOutput, setTestOutput] = useState("Run a mock endpoint to see the JSON response.");

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? null,
    [selectedWorkspaceId, workspaces],
  );

  const loadWorkspaces = useCallback(async () => {
    const response = await fetch("/api/workspaces");
    if (!response.ok) return;
    const data = (await response.json()) as { workspaces: Workspace[] };
    setWorkspaces(data.workspaces);
    setSelectedWorkspaceId((current) => current ?? data.workspaces[0]?.id ?? null);
  }, []);

  const refreshSession = useCallback(async () => {
    const response = await fetch("/api/auth/me");
    const data = (await response.json()) as { user: User | null };
    setUser(data.user);
    if (data.user) await loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    // Initial session hydration must update client state after the API responds.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (selectedWorkspaceId) {
      void loadEndpoints(selectedWorkspaceId);
      void loadLogs(selectedWorkspaceId);
    }
  }, [selectedWorkspaceId]);

  async function loadEndpoints(workspaceId: number) {
    const response = await fetch(`/api/workspaces/${workspaceId}/endpoints`);
    if (!response.ok) return;
    const data = (await response.json()) as { endpoints: MockEndpoint[] };
    setEndpoints(data.endpoints);
  }

  async function loadLogs(workspaceId: number) {
    const response = await fetch(`/api/workspaces/${workspaceId}/logs`);
    if (!response.ok) return;
    const data = (await response.json()) as { logs: RequestLog[] };
    setLogs(data.logs);
  }

  async function handleAuth(formData: FormData) {
    setStatus("loading");
    setMessage("");

    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    const response = await fetch(`/api/auth/${authMode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setStatus("error");
      setMessage(data.error ?? "Authentication failed.");
      return;
    }

    setStatus("success");
    setMessage("Signed in successfully.");
    await refreshSession();
  }

  async function createWorkspace(formData: FormData) {
    setStatus("loading");
    setMessage("");

    const response = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(formData.get("name") ?? ""),
        slug: String(formData.get("slug") ?? ""),
        description: String(formData.get("description") ?? ""),
      }),
    });

    const data = (await response.json()) as { error?: string; id?: number };
    if (!response.ok) {
      setStatus("error");
      setMessage(data.error ?? "Could not create workspace.");
      return;
    }

    setStatus("success");
    setMessage("Workspace created.");
    await loadWorkspaces();
    if (data.id) setSelectedWorkspaceId(data.id);
  }

  async function createEndpoint(formData: FormData) {
    if (!selectedWorkspace) return;
    setStatus("loading");
    setMessage("");

    let responseBody: unknown;
    try {
      responseBody = JSON.parse(String(formData.get("responseBody") ?? "{}"));
    } catch {
      setStatus("error");
      setMessage("Response body must be valid JSON.");
      return;
    }

    const response = await fetch(`/api/workspaces/${selectedWorkspace.id}/endpoints`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: String(formData.get("method") ?? "GET") as HttpMethod,
        path: String(formData.get("path") ?? ""),
        name: String(formData.get("name") ?? ""),
        description: String(formData.get("description") ?? ""),
        statusCode: Number(formData.get("statusCode") ?? 200),
        responseDelayMs: Number(formData.get("responseDelayMs") ?? 0),
        responseBody,
      }),
    });

    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setStatus("error");
      setMessage(data.error ?? "Could not create endpoint.");
      return;
    }

    setStatus("success");
    setMessage("Endpoint created.");
    await loadEndpoints(selectedWorkspace.id);
  }

  async function testEndpoint(endpoint: MockEndpoint) {
    if (!selectedWorkspace) return;
    const url = `/api/mock/${selectedWorkspace.slug}${endpoint.path}`;
    setTestOutput(`Calling ${endpoint.method} ${url} ...`);

    const response = await fetch(url, { method: endpoint.method });
    const text = await response.text();

    try {
      setTestOutput(JSON.stringify(JSON.parse(text), null, 2));
    } catch {
      setTestOutput(text);
    }

    await loadLogs(selectedWorkspace.id);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setWorkspaces([]);
    setEndpoints([]);
    setSelectedWorkspaceId(null);
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-5 py-6 text-slate-950">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="text-sm font-black text-cyan-700">
              MockAPI Studio
            </Link>
            <h1 className="mt-2 text-3xl font-black tracking-normal">Studio Dashboard</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Create workspaces, define mock endpoints, and test generated URLs.
            </p>
          </div>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-slate-600 shadow-sm">
                {user.email}
              </span>
              <button
                onClick={logout}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-black"
              >
                Logout
              </button>
            </div>
          ) : null}
        </header>

        {message ? (
          <div
            className={`mb-5 rounded-lg border px-4 py-3 text-sm font-bold ${
              status === "error"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {message}
          </div>
        ) : null}

        {!user ? (
          <AuthPanel authMode={authMode} setAuthMode={setAuthMode} onSubmit={handleAuth} />
        ) : (
          <div className="grid gap-5 lg:grid-cols-[330px_minmax(0,1fr)]">
            <aside className="space-y-5">
              <CreateWorkspaceForm onSubmit={createWorkspace} />
              <WorkspaceList
                selectedWorkspaceId={selectedWorkspaceId}
                setSelectedWorkspaceId={setSelectedWorkspaceId}
                workspaces={workspaces}
              />
            </aside>

            <section className="space-y-5">
              {selectedWorkspace ? (
                <>
                  <CreateEndpointForm workspace={selectedWorkspace} onSubmit={createEndpoint} />
                  <EndpointList
                    endpoints={endpoints}
                    workspace={selectedWorkspace}
                    onTest={testEndpoint}
                  />
                  <TestConsole output={testOutput} />
                  <RequestLogList logs={logs} />
                </>
              ) : (
                <EmptyState />
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

function AuthPanel({
  authMode,
  setAuthMode,
  onSubmit,
}: {
  authMode: "login" | "register";
  setAuthMode: (mode: "login" | "register") => void;
  onSubmit: (formData: FormData) => void;
}) {
  return (
    <section className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
      <div className="mb-5 flex rounded-lg bg-slate-100 p-1">
        {(["register", "login"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setAuthMode(mode)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-black capitalize ${
              authMode === mode ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>
      <form action={onSubmit} className="space-y-4">
        {authMode === "register" ? <Input name="name" label="Name" placeholder="Sneha" /> : null}
        <Input name="email" label="Email" placeholder="you@example.com" type="email" />
        <Input name="password" label="Password" placeholder="8+ characters" type="password" />
        <button className="w-full rounded-lg bg-cyan-600 px-4 py-3 text-sm font-black text-white hover:bg-cyan-700">
          Continue
        </button>
      </form>
    </section>
  );
}

function CreateWorkspaceForm({ onSubmit }: { onSubmit: (formData: FormData) => void }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black">Create Workspace</h2>
      <form action={onSubmit} className="mt-4 space-y-3">
        <Input name="name" label="Workspace name" placeholder="Demo Store" />
        <Input name="slug" label="Public slug" placeholder="demo-store" />
        <TextArea name="description" label="Description" placeholder="Mock APIs for ecommerce UI" />
        <button className="w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-black text-white">
          Create workspace
        </button>
      </form>
    </section>
  );
}

function WorkspaceList({
  workspaces,
  selectedWorkspaceId,
  setSelectedWorkspaceId,
}: {
  workspaces: Workspace[];
  selectedWorkspaceId: number | null;
  setSelectedWorkspaceId: (id: number) => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black">Workspaces</h2>
      <div className="mt-4 space-y-2">
        {workspaces.map((workspace) => (
          <button
            key={workspace.id}
            onClick={() => setSelectedWorkspaceId(workspace.id)}
            className={`w-full rounded-lg border px-3 py-3 text-left ${
              selectedWorkspaceId === workspace.id
                ? "border-cyan-300 bg-cyan-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <span className="block text-sm font-black">{workspace.name}</span>
            <span className="text-xs font-bold text-slate-500">/{workspace.slug}</span>
          </button>
        ))}
        {workspaces.length === 0 ? (
          <p className="text-sm font-medium text-slate-500">Create a workspace to begin.</p>
        ) : null}
      </div>
    </section>
  );
}

function CreateEndpointForm({
  workspace,
  onSubmit,
}: {
  workspace: Workspace;
  onSubmit: (formData: FormData) => void;
}) {
  const [jsonDraft, setJsonDraft] = useState(starterJson);
  const [aiStatus, setAiStatus] = useState("");

  async function generateSample(form: HTMLFormElement | null) {
    if (!form) return;
    setAiStatus("Asking local Ollama...");

    const formData = new FormData(form);
    const response = await fetch("/api/ollama/sample", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: String(formData.get("method") ?? "GET"),
        path: String(formData.get("path") ?? "/items"),
        name: String(formData.get("name") ?? "Sample endpoint"),
        description: String(formData.get("description") ?? ""),
      }),
    });

    const data = (await response.json()) as { json?: unknown; error?: string };
    if (!response.ok) {
      setAiStatus(data.error ?? "Ollama generation failed.");
      return;
    }

    setJsonDraft(JSON.stringify(data.json ?? {}, null, 2));
    setAiStatus("Sample JSON generated locally.");
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black text-cyan-700">/{workspace.slug}</p>
          <h2 className="text-xl font-black">Create Endpoint</h2>
        </div>
        <a
          href={`/docs/${workspace.slug}`}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-black"
        >
          Public docs
        </a>
      </div>
      <form action={onSubmit} className="mt-5 grid gap-4 lg:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Method
          <select name="method" className="rounded-lg border border-slate-300 bg-white px-3 py-3">
            {["GET", "POST", "PUT", "PATCH", "DELETE"].map((method) => (
              <option key={method}>{method}</option>
            ))}
          </select>
        </label>
        <Input name="path" label="Path" placeholder="/products" />
        <Input name="name" label="Endpoint name" placeholder="List products" />
        <Input name="statusCode" label="Status code" placeholder="200" type="number" />
        <Input name="responseDelayMs" label="Delay in ms" placeholder="0" type="number" />
        <TextArea
          name="description"
          label="Description"
          placeholder="Returns products for the storefront."
        />
        <label className="grid gap-2 text-sm font-bold text-slate-700 lg:col-span-2">
          <span className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <span>JSON response</span>
            <button
              type="button"
              onClick={(event) => void generateSample(event.currentTarget.form)}
              className="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-800"
            >
              Generate with local Ollama
            </button>
          </span>
          <textarea
            name="responseBody"
            value={jsonDraft}
            onChange={(event) => setJsonDraft(event.target.value)}
            rows={9}
            className="rounded-lg border border-slate-300 bg-slate-950 px-3 py-3 font-mono text-sm text-slate-50 outline-none ring-cyan-500 focus:ring-2"
          />
          {aiStatus ? <span className="text-xs font-bold text-slate-500">{aiStatus}</span> : null}
        </label>
        <button className="rounded-lg bg-cyan-600 px-4 py-3 text-sm font-black text-white lg:col-span-2">
          Save endpoint
        </button>
      </form>
    </section>
  );
}

function EndpointList({
  endpoints,
  workspace,
  onTest,
}: {
  endpoints: MockEndpoint[];
  workspace: Workspace;
  onTest: (endpoint: MockEndpoint) => void;
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
              <button
                onClick={() => onTest(endpoint)}
                className="rounded-lg border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-black text-cyan-800"
              >
                Test
              </button>
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

function TestConsole({ output }: { output: string }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black">Test Console</h2>
      <pre className="mt-4 min-h-48 overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm leading-6 text-slate-100">
        {output}
      </pre>
    </section>
  );
}

function RequestLogList({ logs }: { logs: RequestLog[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black">Request History</h2>
      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
        {logs.map((log) => (
          <div
            key={log.id}
            className="grid gap-2 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0 md:grid-cols-[90px_1fr_90px_170px]"
          >
            <span className="font-black text-slate-950">{log.method}</span>
            <code className="font-bold text-slate-700">{log.path}</code>
            <span className="font-black text-cyan-700">{log.statusCode}</span>
            <span className="font-medium text-slate-500">
              {new Date(log.createdAt).toLocaleString()}
            </span>
          </div>
        ))}
        {logs.length === 0 ? (
          <p className="px-4 py-5 text-sm font-medium text-slate-500">
            Requests will appear here after you test public mock URLs.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <h2 className="text-xl font-black">Create a workspace first</h2>
      <p className="mt-2 text-sm font-medium text-slate-500">
        Workspaces group endpoints for one frontend project or feature.
      </p>
    </section>
  );
}

function Input({
  label,
  name,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700">
      {label}
      <input
        name={name}
        placeholder={placeholder}
        type={type}
        className="rounded-lg border border-slate-300 bg-white px-3 py-3 outline-none ring-cyan-500 focus:ring-2"
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  placeholder,
}: {
  label: string;
  name: string;
  placeholder: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700">
      {label}
      <textarea
        name={name}
        placeholder={placeholder}
        rows={3}
        className="rounded-lg border border-slate-300 bg-white px-3 py-3 outline-none ring-cyan-500 focus:ring-2"
      />
    </label>
  );
}
