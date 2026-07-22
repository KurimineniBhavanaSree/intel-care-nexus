import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Stethoscope, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create your account — MedIntel" },
      { name: "description", content: "Create a MedIntel account to analyze medical reports, prescriptions and images with explainable AI." },
      { property: "og:title", content: "Create your account — MedIntel" },
      { property: "og:description", content: "Join MedIntel — explainable AI for healthcare." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) return setError("Please fill in all required fields.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    setError(null);
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-soft via-background to-accent-soft">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="grid w-full gap-10 md:grid-cols-2">
          <div className="hidden flex-col justify-between md:flex">
            <Link to="/" className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground"><Stethoscope size={18} /></span>
              <span className="text-lg font-bold">MedIntel</span>
            </Link>
            <div>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight">Start with confidence.</h1>
              <p className="mt-3 max-w-md text-muted-foreground">Create your account and unlock explainable AI for medical reports, prescriptions and images.</p>
              <ul className="mt-6 space-y-2 text-sm">
                {["Free during clinical preview", "Cited answers, no black boxes", "Multimodal ingestion"].map((p) => (
                  <li key={p} className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5 text-accent" />{p}</li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} MedIntel</p>
          </div>

          <div className="card-soft p-8 shadow-elevated">
            <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
              <ArrowLeft size={14} /> Back to Home
            </Link>
            <h2 className="text-2xl font-bold">Create account</h2>
            <p className="mt-1 text-sm text-muted-foreground">Takes less than a minute.</p>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle size={16} className="mt-0.5" /><span>{error}</span>
              </div>
            )}

            <form onSubmit={submit} className="mt-5 space-y-4">
              {[
                { label: "Full name", k: "name" as const, type: "text", placeholder: "Dr. Jane Doe" },
                { label: "Email", k: "email" as const, type: "email", placeholder: "you@hospital.com" },
                { label: "Phone", k: "phone" as const, type: "tel", placeholder: "+91 98765 43210" },
                { label: "Password", k: "password" as const, type: "password", placeholder: "At least 6 characters" },
                { label: "Confirm password", k: "confirm" as const, type: "password", placeholder: "Re-enter password" },
              ].map((f) => (
                <div key={f.k}>
                  <label className="text-xs font-semibold text-muted-foreground">{f.label}</label>
                  <input
                    type={f.type}
                    value={form[f.k]}
                    onChange={(e) => set(f.k, e.target.value)}
                    placeholder={f.placeholder}
                    className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                  />
                </div>
              ))}

              <button type="submit" className="btn-primary h-11 w-full">Create account</button>
            </form>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
