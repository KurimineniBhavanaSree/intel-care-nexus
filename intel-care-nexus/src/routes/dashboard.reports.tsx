import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Download, Eye, Loader2, Search, Trash2 } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import Breadcrumb from "@/components/Breadcrumb";
import { reportService, type MedicalReport } from "@/services/reportService";

export const Route = createFileRoute("/dashboard/reports")({
  head: () => ({
    meta: [
      { title: "Previous Reports - MedIntel" },
      { name: "description", content: "Browse, search, sort, and manage all previously uploaded medical reports." },
      { property: "og:title", content: "Previous Reports - MedIntel" },
      { property: "og:description", content: "Manage your MedIntel report history." },
    ],
  }),
  component: ReportsPage,
});

type SortKey = "uploaded_at" | "patient_name" | "report_type" | "status";

function ReportsPage() {
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("uploaded_at");
  const [asc, setAsc] = useState(false);
  const [rows, setRows] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    reportService
      .getReports()
      .then((data) => {
        if (active) setRows(data);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Unable to load reports.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = q.toLowerCase();
    const list = rows.filter((report) =>
      !term ||
      `${report.id} ${report.filename} ${report.patient_name ?? ""} ${report.report_type ?? ""} ${report.status}`.toLowerCase().includes(term),
    );

    return [...list].sort((a, b) => {
      const av = String(a[sortKey] ?? "");
      const bv = String(b[sortKey] ?? "");
      return asc ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [q, sortKey, asc, rows]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setAsc((value) => !value);
    } else {
      setSortKey(key);
      setAsc(true);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${bytes} B`;
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Dashboard", to: "/dashboard" }, { label: "Previous Reports" }]} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Previous Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">All reports uploaded to your workspace.</p>
        </div>
        <Link to="/dashboard/upload" className="btn-primary">
          Upload new
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="card-soft p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by patient, type or report ID..."
            className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
          />
        </div>
      </div>

      <div className="card-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">
                  <button onClick={() => toggleSort("patient_name")} className="inline-flex items-center gap-1 hover:text-foreground">
                    Patient <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-5 py-3">
                  <button onClick={() => toggleSort("report_type")} className="inline-flex items-center gap-1 hover:text-foreground">
                    Type <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-5 py-3">
                  <button onClick={() => toggleSort("uploaded_at")} className="inline-flex items-center gap-1 hover:text-foreground">
                    Date <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-5 py-3">Size</th>
                <th className="px-5 py-3">
                  <button onClick={() => toggleSort("status")} className="inline-flex items-center gap-1 hover:text-foreground">
                    Status <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Loading reports...
                    </span>
                  </td>
                </tr>
              )}
              {!loading && filtered.map((report) => (
                <tr key={report.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-5 py-3 font-mono text-xs font-semibold">{report.id}</td>
                  <td className="px-5 py-3">{report.patient_name ?? "Unavailable"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{report.report_type}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {new Date(report.uploaded_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{formatSize(report.file_size)}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={report.status} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <Link
                        to="/dashboard/analysis"
                        search={{ reportId: report.id }}
                        className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"
                        aria-label="View"
                      >
                        <Eye size={14} />
                      </Link>
                      <a
                        href={reportService.getReportFileUrl(report.id)}
                        className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"
                        aria-label="Download"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Download size={14} />
                      </a>
                      <button
                        onClick={async () => {
                          try {
                            await reportService.deleteReport(report.id);
                            const updated = await reportService.getReports();
                            setRows(updated);
                          } catch (err) {
                            setError(err instanceof Error ? err.message : "Unable to delete report.");
                          }
                        }}
                        className="grid h-8 w-8 place-items-center rounded-md text-destructive hover:bg-destructive/10"
                        aria-label="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No reports found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
