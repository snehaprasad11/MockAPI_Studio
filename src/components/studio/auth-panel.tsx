import { Input, submitClientForm } from "@/components/studio/form-fields";

export function AuthPanel({
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
      <form onSubmit={(event) => submitClientForm(event, onSubmit)} className="space-y-4">
        {authMode === "register" ? <Input name="name" label="Name" placeholder="Sneha" /> : null}
        <Input name="email" label="Email" placeholder="you@example.com" type="email" />
        <Input name="password" label="Password" placeholder="8+ characters" type="password" />
        <button
          type="submit"
          className="w-full rounded-lg bg-cyan-600 px-4 py-3 text-sm font-black text-white hover:bg-cyan-700"
        >
          Continue
        </button>
      </form>
    </section>
  );
}
