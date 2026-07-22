import type { ReportStatus } from "@/lib/mock-data";

const tones: Record<ReportStatus, string> = {
  Analyzed: "bg-accent-soft text-accent",
  Processing: "bg-primary-soft text-primary",
  Pending: "bg-muted text-muted-foreground",
  Failed: "bg-destructive/10 text-destructive",
};

export default function StatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[status]}`}>
      {status}
    </span>
  );
}
