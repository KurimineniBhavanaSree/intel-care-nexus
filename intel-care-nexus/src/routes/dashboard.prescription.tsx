import { createFileRoute } from "@tanstack/react-router";
import { Pill, AlertTriangle, Clock, Download } from "lucide-react";
import { prescriptionSample } from "@/lib/mock-data";
import Breadcrumb from "@/components/Breadcrumb";

export const Route = createFileRoute("/dashboard/prescription")({
  head: () => ({
    meta: [
      { title: "Prescription Analyzer — MedIntel" },
      { name: "description", content: "Extract medicines, dosage, timing, warnings, side effects, and interactions from prescriptions." },
      { property: "og:title", content: "Prescription Analyzer — MedIntel" },
      { property: "og:description", content: "AI-powered prescription analysis." },
    ],
  }),
  component: PrescriptionPage,
});

function PrescriptionPage() {
  const p = prescriptionSample;
  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Dashboard", to: "/dashboard" }, { label: "Prescription" }]} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prescription Analyzer</h1>
          <p className="mt-1 text-sm text-muted-foreground">Extracted medicine list with dosage, warnings, and interactions.</p>
        </div>
        <button className="btn-outline"><Download size={16} /> Export</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card-soft overflow-hidden lg:col-span-1">
          <div className="aspect-[3/4] bg-gradient-to-br from-primary-soft to-accent-soft p-8">
            <div className="h-full w-full rounded-lg border border-dashed border-border bg-card p-5 shadow-inner">
              <div className="text-xs font-semibold uppercase text-muted-foreground">Rx</div>
              <div className="mt-3 space-y-1 font-serif text-sm">
                <p>{p.doctor}</p>
                <p className="text-xs text-muted-foreground">Date: {p.date}</p>
                <hr className="my-3 border-border" />
                {p.medicines.map((m) => (
                  <div key={m.name} className="mb-2">
                    <div className="font-semibold">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.dosage} · {m.timing}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-border p-4 text-center text-xs text-muted-foreground">
            Prescription preview (mock image)
          </div>
        </div>

        <div className="space-y-4 lg:col-span-2">
          {p.medicines.map((m) => (
            <div key={m.name} className="card-soft p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-soft text-primary">
                    <Pill size={18} />
                  </span>
                  <div>
                    <div className="text-base font-bold">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.dosage} · {m.duration}</div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
                  <Clock size={12} /> {m.timing}
                </span>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Warnings</div>
                  <ul className="mt-1 space-y-1 text-xs">
                    {m.warnings.map((w) => (
                      <li key={w} className="flex items-start gap-1.5">
                        <AlertTriangle size={11} className="mt-0.5 text-warning-foreground" /><span>{w}</span>
                      </li>
                    ))}
                    {m.warnings.length === 0 && <li className="text-muted-foreground">None reported.</li>}
                  </ul>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Possible Side Effects</div>
                  <ul className="mt-1 flex flex-wrap gap-1">
                    {m.sideEffects.map((s) => (
                      <li key={s} className="rounded-full bg-muted px-2 py-0.5 text-[11px]">{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Interactions</div>
                  <ul className="mt-1 flex flex-wrap gap-1">
                    {m.interactions.length === 0 && <li className="text-xs text-muted-foreground">None detected.</li>}
                    {m.interactions.map((i) => (
                      <li key={i} className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">{i}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
