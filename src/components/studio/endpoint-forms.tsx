"use client";

import Link from "next/link";
import { useState } from "react";

import { Input, TextArea, submitClientForm } from "@/components/studio/form-fields";
import type { MockEndpoint, Workspace } from "@/lib/types";

const starterJson = `{
  "id": 1,
  "name": "Launch Kit",
  "price": 49,
  "inStock": true
}`;

export function CreateEndpointForm({
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
        <Link
          href={`/docs/${workspace.slug}`}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-black"
        >
          Public docs
        </Link>
      </div>
      <form onSubmit={(event) => submitClientForm(event, onSubmit)} className="mt-5 grid gap-4 lg:grid-cols-2">
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
        <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 lg:col-span-2 md:grid-cols-[1fr_160px_1fr]">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input name="errorEnabled" type="checkbox" className="size-4 rounded border-slate-300" />
            Simulate error response
          </label>
          <Input name="errorStatusCode" label="Error status" placeholder="500" type="number" />
          <Input name="errorMessage" label="Error message" placeholder="Something went wrong" />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-cyan-600 px-4 py-3 text-sm font-black text-white lg:col-span-2"
        >
          Save endpoint
        </button>
      </form>
    </section>
  );
}

export function EditEndpointPanel({
  endpoint,
  onCancel,
  onSubmit,
}: {
  endpoint: MockEndpoint;
  onCancel: () => void;
  onSubmit: (formData: FormData) => void;
}) {
  const [jsonDraft, setJsonDraft] = useState(JSON.stringify(endpoint.responseBody, null, 2));

  return (
    <section className="rounded-lg border border-cyan-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-black text-cyan-700">Editing endpoint</p>
          <h2 className="text-xl font-black">
            {endpoint.method} {endpoint.path}
          </h2>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-black"
        >
          Cancel
        </button>
      </div>
      <form onSubmit={(event) => submitClientForm(event, onSubmit)} className="mt-5 grid gap-4 lg:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Method
          <select
            name="method"
            defaultValue={endpoint.method}
            className="rounded-lg border border-slate-300 bg-white px-3 py-3"
          >
            {["GET", "POST", "PUT", "PATCH", "DELETE"].map((method) => (
              <option key={method}>{method}</option>
            ))}
          </select>
        </label>
        <Input name="path" label="Path" placeholder="/products" defaultValue={endpoint.path} />
        <Input name="name" label="Endpoint name" placeholder="List products" defaultValue={endpoint.name} />
        <Input
          name="statusCode"
          label="Status code"
          placeholder="200"
          type="number"
          defaultValue={String(endpoint.statusCode)}
        />
        <Input
          name="responseDelayMs"
          label="Delay in ms"
          placeholder="0"
          type="number"
          defaultValue={String(endpoint.responseDelayMs)}
        />
        <TextArea
          name="description"
          label="Description"
          placeholder="Returns products for the storefront."
          defaultValue={endpoint.description ?? ""}
        />
        <label className="grid gap-2 text-sm font-bold text-slate-700 lg:col-span-2">
          JSON response
          <textarea
            name="responseBody"
            value={jsonDraft}
            onChange={(event) => setJsonDraft(event.target.value)}
            rows={9}
            className="rounded-lg border border-slate-300 bg-slate-950 px-3 py-3 font-mono text-sm text-slate-50 outline-none ring-cyan-500 focus:ring-2"
          />
        </label>
        <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 lg:col-span-2 md:grid-cols-[1fr_160px_1fr]">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input
              name="errorEnabled"
              type="checkbox"
              defaultChecked={endpoint.errorEnabled}
              className="size-4 rounded border-slate-300"
            />
            Simulate error response
          </label>
          <Input
            name="errorStatusCode"
            label="Error status"
            placeholder="500"
            type="number"
            defaultValue={String(endpoint.errorStatusCode)}
          />
          <Input name="errorMessage" label="Error message" placeholder="Something went wrong" />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-cyan-600 px-4 py-3 text-sm font-black text-white lg:col-span-2"
        >
          Update endpoint
        </button>
      </form>
    </section>
  );
}
