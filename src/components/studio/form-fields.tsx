import type { ChangeEventHandler, FormEvent } from "react";

export function submitClientForm(
  event: FormEvent<HTMLFormElement>,
  onSubmit: (formData: FormData) => void,
) {
  event.preventDefault();
  onSubmit(new FormData(event.currentTarget));
}

export function textField(formData: FormData, name: string, fallback = "") {
  const value = String(formData.get(name) ?? "").trim();
  return value || fallback;
}

export function numberField(formData: FormData, name: string, fallback: number) {
  const value = String(formData.get(name) ?? "").trim();
  return value === "" ? fallback : Number(value);
}

export function slugDraft(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function Input({
  label,
  name,
  onChange,
  placeholder,
  type = "text",
  defaultValue,
  value,
}: {
  label: string;
  name: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  placeholder: string;
  type?: string;
  defaultValue?: string;
  value?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700">
      {label}
      <input
        name={name}
        placeholder={placeholder}
        type={type}
        defaultValue={value === undefined ? defaultValue : undefined}
        value={value}
        onChange={onChange}
        className="rounded-lg border border-slate-300 bg-white px-3 py-3 outline-none ring-cyan-500 focus:ring-2"
      />
    </label>
  );
}

export function TextArea({
  label,
  name,
  onChange,
  placeholder,
  defaultValue,
  value,
}: {
  label: string;
  name: string;
  onChange?: ChangeEventHandler<HTMLTextAreaElement>;
  placeholder: string;
  defaultValue?: string;
  value?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700">
      {label}
      <textarea
        name={name}
        placeholder={placeholder}
        defaultValue={value === undefined ? defaultValue : undefined}
        value={value}
        onChange={onChange}
        rows={3}
        className="rounded-lg border border-slate-300 bg-white px-3 py-3 outline-none ring-cyan-500 focus:ring-2"
      />
    </label>
  );
}
