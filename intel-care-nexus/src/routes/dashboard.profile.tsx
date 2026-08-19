import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Camera, Save, CheckCircle2 } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import { authService, type User } from "@/services/authService";

export const Route = createFileRoute("/dashboard/profile")({
  head: () => ({
    meta: [
      { title: "Profile — MedIntel" },
      { name: "description", content: "Manage your MedIntel profile: personal details, emergency contact, and profile photo." },
      { property: "og:title", content: "Profile — MedIntel" },
      { property: "og:description", content: "Manage your MedIntel profile." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    emergency: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    authService
      .getCurrentUser()
      .then((data) => {
        if (!active) {
          return;
        }
        setUser(data);
        setForm({
          name: data.name ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          dob: data.date_of_birth ?? "",
          gender: data.gender ?? "",
          emergency: data.emergency_contact ?? "",
        });
      })
      .catch(() => {
        if (active) {
          setUser(null);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const set = (k: keyof typeof form, v: string) => { setForm((f) => ({ ...f, [k]: v })); setSaved(false); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Dashboard", to: "/dashboard" }, { label: "Profile" }]} />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Update your personal information and contact details.</p>
      </div>

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
        <div className="card-soft flex flex-col items-center p-6 lg:col-span-1">
          <div className="relative">
            <div className="grid h-28 w-28 place-items-center rounded-full border-4 border-background bg-primary-soft text-2xl font-bold text-primary shadow-elevated">
              {(user?.name ?? "User")
                .split(" ")
                .filter(Boolean)
                .map((part) => part[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
            <button type="button" className="absolute bottom-1 right-1 grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-elevated hover:bg-primary/90">
              <Camera size={15} />
            </button>
          </div>
          <div className="mt-4 text-center">
            <div className="text-lg font-bold">{form.name}</div>
            <div className="text-xs text-muted-foreground">{user?.role ?? "Authenticated user"}</div>
          </div>
          <div className="mt-6 w-full space-y-2 border-t border-border pt-4 text-sm">
            <Row k="Email" v={form.email} />
            <Row k="Phone" v={form.phone} />
            <Row k="DOB" v={form.dob} />
          </div>
        </div>

        <div className="card-soft space-y-4 p-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full Name" value={form.name} onChange={(v) => set("name", v)} />
            <Field label="Email" type="email" value={form.email} onChange={(v) => set("email", v)} />
            <Field label="Phone" value={form.phone} onChange={(v) => set("phone", v)} />
            <Field label="Date of Birth" type="date" value={form.dob} onChange={(v) => set("dob", v)} />
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Gender</label>
              <select value={form.gender} onChange={(e) => set("gender", e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20">
                {["Female", "Male", "Non-binary", "Prefer not to say"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <Field label="Emergency Contact" value={form.emergency} onChange={(v) => set("emergency", v)} />
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            {saved ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                <CheckCircle2 size={13} /> Saved
              </span>
            ) : <span />}
            <button type="submit" className="btn-primary"><Save size={16} /> Save changes</button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2 text-xs">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium text-right">{v}</span>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
      />
    </div>
  );
}
