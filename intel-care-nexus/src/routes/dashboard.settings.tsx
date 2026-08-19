import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sun, Moon, Bell, Globe, Lock, ShieldCheck, User as UserIcon } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({
    meta: [
      { title: "Settings — MedIntel" },
      { name: "description", content: "Configure MedIntel preferences: theme, notifications, language, privacy, and security." },
      { property: "og:title", content: "Settings — MedIntel" },
      { property: "og:description", content: "Manage your MedIntel preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [notif, setNotif] = useState({ email: true, push: true, digest: false });
  const [lang, setLang] = useState("English (US)");
  const [privacy, setPrivacy] = useState({ shareUsage: false, dataSell: false });
  const [twoFA, setTwoFA] = useState(true);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Dashboard", to: "/dashboard" }, { label: "Settings" }]} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your MedIntel workspace preferences.</p>
      </div>

      <Section icon={Sun} title="Theme" desc="Choose how MedIntel looks to you.">
        <div className="flex gap-3">
          {(["light", "dark"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`flex flex-1 items-center gap-3 rounded-xl border p-4 text-left transition-colors ${theme === t ? "border-primary bg-primary-soft" : "border-border hover:bg-muted"}`}
            >
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-background">
                {t === "light" ? <Sun size={18} /> : <Moon size={18} />}
              </span>
              <div>
                <div className="text-sm font-semibold capitalize">{t}</div>
                <div className="text-xs text-muted-foreground">{t === "light" ? "Bright and clean" : "Easier on the eyes"}</div>
              </div>
            </button>
          ))}
        </div>
      </Section>

      <Section icon={Bell} title="Notifications" desc="Choose where and when you get alerts.">
        <Toggle label="Email notifications" checked={notif.email} onChange={(v) => setNotif({ ...notif, email: v })} />
        <Toggle label="Push notifications" checked={notif.push} onChange={(v) => setNotif({ ...notif, push: v })} />
        <Toggle label="Weekly clinical digest" checked={notif.digest} onChange={(v) => setNotif({ ...notif, digest: v })} />
      </Section>

      <Section icon={Globe} title="Language" desc="Interface language for reports and chat.">
        <select value={lang} onChange={(e) => setLang(e.target.value)} className="h-11 w-full max-w-sm rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20">
          {["English (US)", "English (UK)", "हिन्दी", "Español", "Français", "Deutsch"].map((l) => <option key={l}>{l}</option>)}
        </select>
      </Section>

      <Section icon={Lock} title="Privacy" desc="Control how your data is used.">
        <Toggle label="Share anonymized usage data to improve models" checked={privacy.shareUsage} onChange={(v) => setPrivacy({ ...privacy, shareUsage: v })} />
        <Toggle label="Allow third-party research partners" checked={privacy.dataSell} onChange={(v) => setPrivacy({ ...privacy, dataSell: v })} />
      </Section>

      <Section icon={UserIcon} title="Account" desc="Basic account preferences.">
        <div className="flex flex-wrap gap-2">
          <button className="btn-outline">Change email</button>
          <button className="btn-outline">Change password</button>
          <button className="btn-outline text-destructive">Delete account</button>
        </div>
      </Section>

      <Section icon={ShieldCheck} title="Security" desc="Add an extra layer of protection.">
        <Toggle label="Two-factor authentication" checked={twoFA} onChange={setTwoFA} />
        <div className="text-xs text-muted-foreground">Active sessions: 2 · Last login: today at 09:41</div>
      </Section>
    </div>
  );
}

function Section({ icon: Icon, title, desc, children }: { icon: React.ComponentType<{ size?: number }>; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="card-soft p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-soft text-primary"><Icon size={18} /></span>
        <div className="flex-1">
          <div className="text-base font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-border p-3 hover:bg-muted/50">
      <span className="text-sm">{label}</span>
      <span className="relative inline-block">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="block h-6 w-11 rounded-full bg-border transition-colors peer-checked:bg-primary" />
        <span className="absolute left-0.5 top-0.5 block h-5 w-5 rounded-full bg-background transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
