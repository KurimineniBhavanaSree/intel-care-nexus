import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Stethoscope, ArrowLeft, Eye, EyeOff, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — MedIntel" },
      { name: "description", content: "Sign in to your MedIntel account to access AI-powered medical report and image analysis." },
      { property: "og:title", content: "Sign in — MedIntel" },
      { property: "og:description", content: "Access explainable AI healthcare tools." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setError(null);
    // Mock login — navigate to dashboard
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
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight">Welcome back.</h1>
              <p className="mt-3 max-w-md text-muted-foreground">
                Sign in to access your reports, prescriptions, and AI-powered medical insights — always with cited sources.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} MedIntel</p>
          </div>

          <div className="card-soft p-8 shadow-elevated">
            <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
              <ArrowLeft size={14} /> Back to Home
            </Link>
            <h2 className="text-2xl font-bold">Sign in</h2>
            <p className="mt-1 text-sm text-muted-foreground">Use your MedIntel account credentials.</p>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle size={16} className="mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={submit} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@hospital.com"
                  className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Password</label>
                <div className="relative mt-1">
                  <input
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 pr-10 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                  />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted">
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-border accent-primary" />
                  <span className="text-muted-foreground">Remember me</span>
                </label>
                <a href="#" className="font-medium text-primary hover:underline">Forgot password?</a>
              </div>

              <button type="submit" className="btn-primary h-11 w-full">Sign in</button>
            </form>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="font-semibold text-primary hover:underline">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
