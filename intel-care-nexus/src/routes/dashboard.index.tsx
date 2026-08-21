import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Bookmark, Eye, FileText, Image as ImgIcon, Loader2, MessageSquare, TrendingUp } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import StatusBadge from "@/components/StatusBadge";
import { authService, type User } from "@/services/authService";
import { reportService, type MedicalReport } from "@/services/reportService";
import { chatService } from "@/services/chatService";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [
      { title: "Dashboard - MedIntel" },
      { name: "description", content: "Overview of your uploaded reports, AI chats, medical images, and recent activity in MedIntel." },
      { property: "og:title", content: "Dashboard - MedIntel" },
      { property: "og:description", content: "Your MedIntel workspace overview." },
    ],
  }),
  component: DashboardHome,
});

const icons = [FileText, MessageSquare, ImgIcon, Bookmark];

function DashboardHome() {
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [chatCount, setChatCount] = useState<number>(0);
  const [loadingChatCount, setLoadingChatCount] = useState(true);

  useEffect(() => {
    let active = true;
    authService
      .getCurrentUser()
      .then((data) => {
        if (active) setUser(data);
      })
      .catch(() => {
        if (active) setUser(null);
      });

    reportService
      .getReports()
      .then((data) => {
        if (active) setReports(data);
      })
      .catch(() => {
        if (active) setReports([]);
      })
      .finally(() => {
        if (active) setLoadingReports(false);
      });

    chatService
      .getCount()
      .then((data) => {
        if (active) setChatCount(data.count);
      })
      .catch(() => {
        if (active) setChatCount(0);
      })
      .finally(() => {
        if (active) setLoadingChatCount(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(
    () => [
      { label: "Reports Uploaded", value: reports.length, delta: "Live", tone: "primary" as const },
      { label: "AI Chats", value: chatCount, delta: "Live", tone: "accent" as const },
      { label: "Medical Images", value: 0, delta: "Connected", tone: "primary" as const },
      { label: "Saved Reports", value: reports.filter((report) => report.status === "analyzed").length, delta: "Live", tone: "accent" as const },
    ],
    [reports, chatCount],
  );

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Dashboard" }]} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back{user?.name ? `, ${user.name}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Here's a snapshot of your MedIntel workspace today.</p>
        </div>
        <Link to="/dashboard/upload" className="btn-primary">
          Upload new report
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => {
          const Icon = icons[i];
          const isPrimary = s.tone === "primary";
          return (
            <div key={s.label} className="card-soft p-5">
              <div className="flex items-center justify-between">
                <span className={`grid h-10 w-10 place-items-center rounded-lg ${isPrimary ? "bg-primary-soft text-primary" : "bg-accent-soft text-accent"}`}>
                  <Icon size={18} />
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-accent">
                  <TrendingUp size={11} /> {s.delta}
                </span>
              </div>
              <div className="mt-4 text-3xl font-extrabold">{s.value}</div>
              <div className="text-xs font-medium text-muted-foreground">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: "Analyze a Report", desc: "Upload PDF or DOCX for analysis.", to: "/dashboard/upload" },
          { title: "Scan Prescription", desc: "Detect medicines, doses & interactions.", to: "/dashboard/prescription" },
          { title: "Ask MedIntel", desc: "Chat with your cited AI assistant.", to: "/dashboard/chat" },
        ].map((q) => (
          <Link key={q.to} to={q.to} className="card-soft group flex items-center justify-between p-5 transition-shadow hover:shadow-elevated">
            <div>
              <div className="text-base font-semibold">{q.title}</div>
              <div className="text-xs text-muted-foreground">{q.desc}</div>
            </div>
            <ArrowUpRight size={18} className="text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>
        ))}
      </div>

      <div className="card-soft overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="text-base font-semibold">Recent Reports</h2>
            <p className="text-xs text-muted-foreground">Latest uploads and their analysis status.</p>
          </div>
          <Link to="/dashboard/reports" className="text-sm font-semibold text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3">Report ID</th>
                <th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loadingReports && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Loading reports...
                    </span>
                  </td>
                </tr>
              )}
              {!loadingReports && reports.slice(0, 6).map((report) => (
                <tr key={report.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-5 py-3 font-mono text-xs font-semibold">{report.id}</td>
                  <td className="px-5 py-3">{report.patient_name ?? "Unavailable"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{report.report_type}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {new Date(report.uploaded_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={report.status} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      to="/dashboard/analysis"
                      search={{ reportId: report.id }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <Eye size={13} /> View
                    </Link>
                  </td>
                </tr>
              ))}
              {!loadingReports && reports.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No reports have been uploaded yet.
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
