import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search, Download, Eye, Trash2, ArrowUpDown } from "lucide-react";
import { recentReports } from "@/lib/mock-data";
import StatusBadge from "@/components/StatusBadge";
import Breadcrumb from "@/components/Breadcrumb";

export const Route = createFileRoute("/dashboard/reports")({
  head: () => ({
    meta: [
      { title: "Previous Reports — MedIntel" },
      { name: "description", content: "Browse, search, sort, and manage all previously uploaded medical reports." },
      { property: "og:title", content: "Previous Reports — MedIntel" },
      { property: "og:description", content: "Manage your MedIntel report history." },
    ],
  }),
  component: ReportsPage,
});

type SortKey = "date" | "patient" | "type";

function ReportsPage() {
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [asc, setAsc] = useState(false);
  const [rows, setRows] = useState(recentReports);

  const filtered = useMemo(() => {
    const list = rows.filter((r) =>
      !q || (r.patient + r.type + r.id).toLowerCase().includes(q.toLowerCase())
    );
    return list.sort((a, b) => {
      const av = a[sortKey]; const bv = b[sortKey];
      return asc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [q, sortKey, asc, rows]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setAsc((v) => !v);
    else { setSortKey(k); setAsc(true); }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Dashboard", to: "/dashboard" }, { label: "Previous Reports" }]} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Previous Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">All reports uploaded to your workspace.</p>
        </div>
        <Link to="/dashboard/upload" className="btn-primary">Upload new</Link>
      </div>

      <div className="card-soft p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by patient, type or report ID…"
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
                  <button onClick={() => toggleSort("patient")} className="inline-flex items-center gap-1 hover:text-foreground">
                    Patient <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-5 py-3">
                  <button onClick={() => toggleSort("type")} className="inline-flex items-center gap-1 hover:text-foreground">
                    Type <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-5 py-3">
                  <button onClick={() => toggleSort("date")} className="inline-flex items-center gap-1 hover:text-foreground">
                    Date <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-5 py-3">Size</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-5 py-3 font-mono text-xs font-semibold">{r.id}</td>
                  <td className="px-5 py-3">{r.patient}</td>
                  <td className="px-5 py-3 text-muted-foreground">{r.type}</td>
                  <td className="px-5 py-3 text-muted-foreground">{r.date}</td>
                  <td className="px-5 py-3 text-muted-foreground">{r.size}</td>
                  <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <Link to="/dashboard/analysis" className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted" aria-label="View"><Eye size={14} /></Link>
                      <button className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted" aria-label="Download"><Download size={14} /></button>
                      <button
                        onClick={() => setRows((prev) => prev.filter((x) => x.id !== r.id))}
                        className="grid h-8 w-8 place-items-center rounded-md text-destructive hover:bg-destructive/10"
                        aria-label="Delete"
                      ><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">No reports found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
