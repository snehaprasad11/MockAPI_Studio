"use client";

import { useState } from "react";

import { Input, TextArea, slugDraft, submitClientForm } from "@/components/studio/form-fields";
import type { Workspace } from "@/lib/types";

export function CreateWorkspaceForm({ onSubmit }: { onSubmit: (formData: FormData) => void }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugEdited) setSlug(slugDraft(value));
  }

  function handleSlugChange(value: string) {
    setSlugEdited(true);
    setSlug(slugDraft(value));
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black">Create Workspace</h2>
      <form onSubmit={(event) => submitClientForm(event, onSubmit)} className="mt-4 space-y-3">
        <Input
          name="name"
          label="Workspace name"
          placeholder="Demo Store"
          value={name}
          onChange={(event) => handleNameChange(event.target.value)}
        />
        <Input
          name="slug"
          label="Public slug"
          placeholder="demo-store"
          value={slug}
          onChange={(event) => handleSlugChange(event.target.value)}
        />
        <TextArea
          name="description"
          label="Description"
          placeholder="Mock APIs for ecommerce UI"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-black text-white"
        >
          Create workspace
        </button>
      </form>
    </section>
  );
}

export function WorkspaceList({
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
