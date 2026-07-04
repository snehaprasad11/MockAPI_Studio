"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { EmptyState, RequestLogList, TestConsole } from "@/components/studio/activity-panels";
import { AuthPanel } from "@/components/studio/auth-panel";
import { CreateEndpointForm, EditEndpointPanel } from "@/components/studio/endpoint-forms";
import { EndpointList } from "@/components/studio/endpoint-list";
import { numberField, textField } from "@/components/studio/form-fields";
import { ApiKeyPanel, WorkspaceOverview } from "@/components/studio/workspace-overview";
import { CreateWorkspaceForm, WorkspaceList } from "@/components/studio/workspace-sidebar";
import type { HttpMethod, MockEndpoint, RequestLog, User, Workspace } from "@/lib/types";

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
  const [editingEndpoint, setEditingEndpoint] = useState<MockEndpoint | null>(null);
  const [copiedUrl, setCopiedUrl] = useState("");
  const [apiKeyValue, setApiKeyValue] = useState("");

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? null,
    [selectedWorkspaceId, workspaces],
  );
  const workspaceMetrics = useMemo(() => {
    const successfulRequests = logs.filter((log) => log.statusCode >= 200 && log.statusCode < 400).length;
    const failedRequests = logs.filter((log) => log.statusCode >= 400).length;
    const averageDelay =
      endpoints.length === 0
        ? 0
        : Math.round(
            endpoints.reduce((total, endpoint) => total + endpoint.responseDelayMs, 0) /
              endpoints.length,
          );

    return {
      endpointCount: endpoints.length,
      requestCount: logs.length,
      successfulRequests,
      failedRequests,
      averageDelay,
      errorScenarioCount: endpoints.filter((endpoint) => endpoint.errorEnabled).length,
    };
  }, [endpoints, logs]);

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

    const payload = {
      method: String(formData.get("method") ?? "GET") as HttpMethod,
      path: String(formData.get("path") ?? ""),
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      statusCode: numberField(formData, "statusCode", 200),
      responseDelayMs: numberField(formData, "responseDelayMs", 0),
      responseBody,
      errorEnabled: formData.get("errorEnabled") === "on",
      errorStatusCode: numberField(formData, "errorStatusCode", 500),
      errorBody: { error: textField(formData, "errorMessage", "Mock error") },
    };

    const response = await fetch(
      editingEndpoint
        ? `/api/endpoints/${editingEndpoint.id}`
        : `/api/workspaces/${selectedWorkspace.id}/endpoints`,
      {
        method: editingEndpoint ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setStatus("error");
      setMessage(data.error ?? "Could not save endpoint.");
      return;
    }

    setStatus("success");
    setMessage(editingEndpoint ? "Endpoint updated." : "Endpoint created.");
    setEditingEndpoint(null);
    await loadEndpoints(selectedWorkspace.id);
  }

  async function deleteEndpoint(endpoint: MockEndpoint) {
    if (!selectedWorkspace) return;

    const confirmed = window.confirm(`Delete ${endpoint.method} ${endpoint.path}?`);
    if (!confirmed) return;

    const response = await fetch(`/api/endpoints/${endpoint.id}`, { method: "DELETE" });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setStatus("error");
      setMessage(data.error ?? "Could not delete endpoint.");
      return;
    }

    setStatus("success");
    setMessage("Endpoint deleted.");
    if (editingEndpoint?.id === endpoint.id) setEditingEndpoint(null);
    await loadEndpoints(selectedWorkspace.id);
  }

  async function copyEndpointUrl(endpoint: MockEndpoint) {
    if (!selectedWorkspace) return;

    const url = `${window.location.origin}/api/mock/${selectedWorkspace.slug}${endpoint.path}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(""), 1800);
    } catch {
      setStatus("error");
      setMessage("Could not copy the URL automatically. Select and copy it from the endpoint list.");
    }
  }

  async function testEndpoint(endpoint: MockEndpoint) {
    if (!selectedWorkspace) return;
    const url = `/api/mock/${selectedWorkspace.slug}${endpoint.path}`;
    setTestOutput(`Calling ${endpoint.method} ${url} ...`);

    const startedAt = performance.now();
    const headers =
      selectedWorkspace.apiKeyEnabled && apiKeyValue
        ? { "x-mockapi-key": apiKeyValue }
        : undefined;
    const response = await fetch(url, { method: endpoint.method, headers });
    const text = await response.text();
    const duration = Math.round(performance.now() - startedAt);

    try {
      setTestOutput(
        `Status: ${response.status} ${response.statusText}\nTime: ${duration} ms\n\n${JSON.stringify(
          JSON.parse(text),
          null,
          2,
        )}`,
      );
    } catch {
      setTestOutput(`Status: ${response.status} ${response.statusText}\nTime: ${duration} ms\n\n${text}`);
    }

    await loadLogs(selectedWorkspace.id);
  }

  async function updateWorkspaceApiKey(enabled: boolean, rotate = true) {
    if (!selectedWorkspace) return;
    setStatus("loading");
    setMessage("");

    const response = await fetch(`/api/workspaces/${selectedWorkspace.id}/api-key`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled, rotate }),
    });
    const data = (await response.json()) as {
      error?: string;
      apiKey?: string | null;
      apiKeyPrefix?: string | null;
    };

    if (!response.ok) {
      setStatus("error");
      setMessage(data.error ?? "Could not update API key settings.");
      return;
    }

    if (data.apiKey) {
      setApiKeyValue(data.apiKey);
      try {
        await navigator.clipboard.writeText(data.apiKey);
        setMessage("API key generated and copied. Store it now; it is shown only once.");
      } catch {
        setMessage("API key generated. Store it now; it is shown only once.");
      }
    } else {
      setMessage(enabled ? "API key protection enabled." : "API key protection disabled.");
      if (!enabled) setApiKeyValue("");
    }

    setStatus("success");
    await loadWorkspaces();
  }

  async function deleteWorkspace(workspace: Workspace) {
    const confirmed = window.confirm(
      `Delete workspace "${workspace.name}" and all of its endpoints? This cannot be undone.`,
    );
    if (!confirmed) return;

    const response = await fetch(`/api/workspaces/${workspace.id}`, { method: "DELETE" });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setStatus("error");
      setMessage(data.error ?? "Could not delete workspace.");
      return;
    }

    setStatus("success");
    setMessage("Workspace deleted.");
    setSelectedWorkspaceId(null);
    setEndpoints([]);
    setLogs([]);
    await loadWorkspaces();
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
                  <WorkspaceOverview
                    workspace={selectedWorkspace}
                    metrics={workspaceMetrics}
                    onDelete={() => deleteWorkspace(selectedWorkspace)}
                  />
                  <ApiKeyPanel
                    apiKeyValue={apiKeyValue}
                    onDisable={() => updateWorkspaceApiKey(false, false)}
                    onEnable={() => updateWorkspaceApiKey(true, true)}
                    onRotate={() => updateWorkspaceApiKey(true, true)}
                    workspace={selectedWorkspace}
                  />
                  <CreateEndpointForm workspace={selectedWorkspace} onSubmit={createEndpoint} />
                  {copiedUrl ? (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                      Copied {copiedUrl}
                    </div>
                  ) : null}
                  <EndpointList
                    endpoints={endpoints}
                    workspace={selectedWorkspace}
                    onTest={testEndpoint}
                    onEdit={setEditingEndpoint}
                    onDelete={deleteEndpoint}
                    onCopy={copyEndpointUrl}
                  />
                  {editingEndpoint ? (
                    <EditEndpointPanel
                      key={editingEndpoint.id}
                      endpoint={editingEndpoint}
                      onCancel={() => setEditingEndpoint(null)}
                      onSubmit={createEndpoint}
                    />
                  ) : null}
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
