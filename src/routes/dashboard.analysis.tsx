import { createFileRoute } from "@tanstack/react-router";
import { Download, AlertTriangle, BookOpen, ChevronRight, FileText } from "lucide-react";
import { sampleAnalysis } from "@/lib/mock-data";
import Breadcrumb from "@/components/Breadcrumb";

export const Route = createFileRoute("/dashboard/analysis")({
  head: () => ({
    meta: [
      { title: "Report Analysis — MedIntel" },
      { name: "description", content: "AI-generated medical report summary with key findings, detected diseases, and cited evidence." },
      { property: "og:title", content: "Report Analysis — MedIntel" },
      { property: "og:description", content: "Explainable AI summary of your medical report." },
    ],
  }),
  component: AnalysisPage,
});

function AnalysisPage() {
  const a = sampleAnalysis;
  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Dashboard", to: "/dashboard" }, { label: "Report Analysis" }]} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Medical Report Analysis</h1>
          <p className="mt-1 text-sm text-muted-foreground">AI-generated summary with cited evidence.</p>
        </div>
        <button className="btn-primary"><Download size={16} /> Download Report</button>
      </div>

      {/* Patient card */}
      <div className="card-soft p-5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
          <FileText size={14} /> Patient Information
        </div>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {[
            ["Name", a.patient.name],
            ["Age / Sex", `${a.patient.age} · ${a.patient.gender}`],
            ["Patient ID", a.patient.patientId],
            ["Referred by", a.patient.referredBy],
            ["Report date", a.patient.reportDate],
            ["Report type", a.patient.reportType],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{k}</div>
              <div className="mt-0.5 text-sm font-medium">{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: main */}
        <div className="space-y-6 lg:col-span-2">
          <div className="card-soft p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Medical Summary</h2>
            <p className="mt-2 text-sm leading-relaxed">{a.summary}</p>
          </div>

          <div className="card-soft p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Key Findings</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {a.keyFindings.map((k) => (
                <div key={k.label} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">{k.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${k.tone === "success" ? "bg-accent-soft text-accent" : "bg-warning/20 text-warning-foreground"}`}>
                      {k.tone === "success" ? "Normal" : "Attention"}
                    </span>
                  </div>
                  <div className="mt-1 text-lg font-bold">{k.value}</div>
                  <div className="text-xs text-muted-foreground">{k.note}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-soft p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Detected Conditions</h2>
            <div className="mt-3 space-y-2">
              {a.diseases.map((d) => (
                <div key={d.name} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{d.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">{(d.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${d.confidence * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-soft p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Recommendations</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {a.recommendations.map((r) => (
                <li key={r} className="flex items-start gap-2">
                  <ChevronRight size={14} className="mt-1 text-accent" /><span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: side */}
        <div className="space-y-6">
          <div className="card-soft p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Suggested Questions</h2>
            <div className="mt-3 space-y-2">
              {a.questions.map((q) => (
                <button key={q} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-left text-sm hover:border-primary hover:bg-primary-soft">
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="card-soft p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Important Terms</h2>
            <div className="mt-3 space-y-3">
              {a.terms.map((t) => (
                <div key={t.term}>
                  <div className="text-sm font-semibold">{t.term}</div>
                  <div className="text-xs text-muted-foreground">{t.meaning}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-soft p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
              <BookOpen size={14} /> Evidence Sources
            </h2>
            <div className="mt-3 space-y-2">
              {a.sources.map((s) => (
                <div key={s.title} className="rounded-lg border border-border p-3">
                  <div className="text-sm font-semibold">{s.title}</div>
                  <div className="text-xs text-muted-foreground">{s.org} · {s.year}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-xs text-warning-foreground">
            <div className="flex items-center gap-1.5 font-semibold"><AlertTriangle size={13} /> Educational use only</div>
            <p className="mt-1 leading-relaxed">This analysis is not a substitute for professional medical advice. Always consult a qualified clinician.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
