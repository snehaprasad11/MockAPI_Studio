"use client";

import { useState } from "react";

import type { RequestLog } from "@/lib/types";

export function TestConsole({ output }: { output: string }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black">Test Console</h2>
      <pre className="mt-4 min-h-48 overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm leading-6 text-slate-100">
        {output}
      </pre>
    </section>
  );
}

export function RequestLogList({ logs }: { logs: RequestLog[] }) {
  const [filter, setFilter] = useState("");
  const filteredLogs = logs.filter((log) => {
    const query = filter.toLowerCase().trim();
    if (!query) return true;
    return (
      log.method.toLowerCase().includes(query) ||
      log.path.toLowerCase().includes(query) ||
      String(log.statusCode).includes(query)
    );
  });

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-xl font-black">Request History</h2>
        <input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter method, path, status"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold outline-none ring-cyan-500 focus:ring-2"
        />
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
        {filteredLogs.map((log) => (
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
        ) : filteredLogs.length === 0 ? (
          <p className="px-4 py-5 text-sm font-medium text-slate-500">
            No request logs match this filter.
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function EmptyState() {
  return (
    <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <h2 className="text-xl font-black">Create a workspace first</h2>
      <p className="mt-2 text-sm font-medium text-slate-500">
        Workspaces group endpoints for one frontend project or feature.
      </p>
    </section>
  );
}
