import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BookOpen, ChevronRight, Download, FileText, Loader2 } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import { reportService, type ReportAnalysisDetail } from "@/services/reportService";

export const Route = createFileRoute("/dashboard/analysis")({
  validateSearch: (search: Record<string, unknown>) => {
    const raw = search.reportId;
    const reportId =
      typeof raw === "string"
        ? Number(raw)
        : typeof raw === "number"
          ? raw
          : undefined;
    return {
      reportId: Number.isFinite(reportId as number) ? (reportId as number) : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Report Analysis - MedIntel" },
      { name: "description", content: "AI-generated medical report summary with key findings, detected conditions, and cited evidence." },
      { property: "og:title", content: "Report Analysis - MedIntel" },
      { property: "og:description", content: "Explainable AI summary of your medical report." },
    ],
  }),
  component: AnalysisPage,
});

function formatDisplayValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(2);
  if (value && typeof value === "object" && "text" in (value as Record<string, unknown>)) {
    return String((value as { text?: unknown }).text ?? "");
  }
  return "N/A";
}

function AnalysisPage() {
  const { reportId } = Route.useSearch();
  const [analysis, setAnalysis] = useState<ReportAnalysisDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(reportId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reportId) {
      setAnalysis(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    reportService
      .getReportAnalysis(reportId)
      .then((data) => {
        if (active) setAnalysis(data);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const message = err instanceof Error ? err.message : "Unable to load analysis.";
        setError(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reportId]);

  const downloadHref = useMemo(() => {
    if (!reportId) return null;
    return reportService.getReportFileUrl(reportId);
  }, [reportId]);

  const patient = analysis?.patient_info;
  const findings = analysis?.findings ?? [];
  const possibleConditions = analysis?.possible_conditions ?? [];
  const recommendations = analysis?.recommendations ?? [];
  const importantTerms = analysis?.important_terms ?? [];
  const sources = analysis?.evidence_sources ?? [];
  const summary = analysis?.summary ?? "";
  const llmStatus = analysis?.llm_status ?? "unknown";

  const recommendationText = (item: unknown) =>
    typeof item === "string"
      ? item
      : item && typeof item === "object" && "text" in (item as Record<string, unknown>)
        ? String((item as { text?: unknown }).text ?? "")
        : "";

  const termText = (item: unknown) => {
    if (item && typeof item === "object") {
      const typed = item as { term?: unknown; meaning?: unknown; definition?: unknown };
      return {
        term: String(typed.term ?? ""),
        meaning: String(typed.meaning ?? typed.definition ?? ""),
      };
    }
    return { term: "", meaning: "" };
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Dashboard", to: "/dashboard" }, { label: "Report Analysis" }]} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Medical Report Analysis</h1>
          <p className="mt-1 text-sm text-muted-foreground">Real extraction, trusted evidence retrieval, and optional Gemini generation.</p>
        </div>
        {downloadHref ? (
          <a className="btn-primary" href={downloadHref} target="_blank" rel="noreferrer">
            <Download size={16} /> View Report File
          </a>
        ) : (
          <button className="btn-primary" disabled>
            <Download size={16} /> View Report File
          </button>
        )}
      </div>

      {!reportId && (
        <div className="card-soft p-5 text-sm text-muted-foreground">
          Select a report from the upload or reports page to view its analysis.
        </div>
      )}

      {reportId && loading && (
        <div className="card-soft flex items-center gap-3 p-5 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading analysis...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {analysis && (
        <div className="space-y-6">
          <div className="card-soft p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <FileText size={14} /> Patient Information
            </div>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              {[
                ["Name", patient?.name ?? analysis.patient_info.name ?? "Unavailable"],
                ["Age / Sex", [patient?.age ?? "Unavailable", patient?.sex ?? "Unavailable"].join(" / ")],
                ["Patient ID", patient?.patient_id ?? "Unavailable"],
                ["Referred by", patient?.referring_physician ?? "Unavailable"],
                ["Report date", patient?.report_date ?? "Unavailable"],
                ["Report type", patient?.report_type ?? "Unavailable"],
                ["LLM status", llmStatus],
                ["Processing stage", analysis.processing_stage ?? "Unknown"],
              ].map(([key, value]) => (
                <div key={String(key)}>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{key}</div>
                  <div className="mt-0.5 text-sm font-medium">{String(value)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="card-soft p-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Medical Summary</h2>
                <p className="mt-2 text-sm leading-relaxed">
                  {summary || "Report extraction complete. Final interpretation will appear when the analysis is available."}
                </p>
                {analysis.message && (
                  <p className="mt-2 text-xs text-muted-foreground">{analysis.message}</p>
                )}
              </div>

              <div className="card-soft p-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Key Findings</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {findings.map((finding) => (
                    <div key={finding.test_name} className="rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold text-muted-foreground">{finding.test_name}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-foreground">
                          {finding.status}
                        </span>
                      </div>
                      <div className="mt-1 text-lg font-bold">
                        {formatDisplayValue(finding.value)} {finding.unit ? finding.unit : ""}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Reference: {finding.reference_range ?? "Unavailable"}
                      </div>
                      {finding.interpretation && (
                        <div className="mt-1 text-xs text-muted-foreground">{finding.interpretation}</div>
                      )}
                    </div>
                  ))}
                  {findings.length === 0 && (
                    <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                      No structured laboratory findings were extracted from this report.
                    </div>
                  )}
                </div>
              </div>

              <div className="card-soft p-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Detected Conditions</h2>
                <div className="mt-3 space-y-3">
                  {possibleConditions.map((condition) => (
                    <div key={condition.name} className="rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold">{condition.name}</span>
                        {condition.clinical_correlation_required ? (
                          <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning-foreground">
                            Clinical correlation required
                          </span>
                        ) : null}
                      </div>
                      {condition.explanation && (
                        <p className="mt-1 text-xs text-muted-foreground">{condition.explanation}</p>
                      )}
                      {condition.evidence_ids && condition.evidence_ids.length > 0 && (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Evidence: {condition.evidence_ids.join(", ")}
                        </p>
                      )}
                    </div>
                  ))}
                  {possibleConditions.length === 0 && (
                    <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                      No evidence-supported conditions were generated for this report.
                    </div>
                  )}
                </div>
              </div>

              <div className="card-soft p-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Recommendations</h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {recommendations.map((item, index) => (
                    <li key={`${index}-${recommendationText(item)}`} className="flex items-start gap-2">
                      <ChevronRight size={14} className="mt-1 text-accent" />
                      <span>{recommendationText(item)}</span>
                    </li>
                  ))}
                  {recommendations.length === 0 && (
                    <li className="text-sm text-muted-foreground">No recommendations were generated.</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card-soft p-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Important Terms</h2>
                <div className="mt-3 space-y-3">
                  {importantTerms.map((item, index) => {
                    const term = termText(item);
                    return (
                      <div key={`${term.term}-${index}`}>
                        <div className="text-sm font-semibold">{term.term}</div>
                        <div className="text-xs text-muted-foreground">{term.meaning}</div>
                      </div>
                    );
                  })}
                  {importantTerms.length === 0 && (
                    <div className="text-sm text-muted-foreground">No glossary terms were generated.</div>
                  )}
                </div>
              </div>

              <div className="card-soft p-5">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                  <BookOpen size={14} /> Evidence Sources
                </h2>
                <div className="mt-3 space-y-2">
                  {sources.map((source) => (
                    <div key={source.citation_id} className="rounded-lg border border-border p-3">
                      <div className="text-sm font-semibold">{source.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {source.organization} - {source.year} - {source.source_type}
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">{source.citation_id}</div>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
                      >
                        View Source
                      </a>
                    </div>
                  ))}
                  {sources.length === 0 && (
                    <div className="text-sm text-muted-foreground">No evidence sources were retrieved.</div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-xs text-warning-foreground">
                <div className="flex items-center gap-1.5 font-semibold">
                  <AlertTriangle size={13} /> Educational use only
                </div>
                <p className="mt-1 leading-relaxed">
                  This analysis is not a substitute for professional medical advice. Always consult a qualified clinician.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && reportId && !analysis && !error && (
        <div className="card-soft p-5 text-sm text-muted-foreground">
          No analysis is available for this report yet.
          <div className="mt-2">
            <Link to="/dashboard/reports" className="text-primary hover:underline">
              Back to reports
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
