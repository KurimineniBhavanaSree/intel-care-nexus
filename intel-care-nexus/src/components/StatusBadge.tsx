type ReportStatus = "Analyzed" | "Processing" | "Pending" | "Failed" | "analyzed" | "processing" | "pending" | "failed";

const tones: Record<ReportStatus, string> = {
  Analyzed: "bg-accent-soft text-accent",
  Processing: "bg-primary-soft text-primary",
  Pending: "bg-muted text-muted-foreground",
  Failed: "bg-destructive/10 text-destructive",
  analyzed: "bg-accent-soft text-accent",
  processing: "bg-primary-soft text-primary",
  pending: "bg-muted text-muted-foreground",
  failed: "bg-destructive/10 text-destructive",
};

export default function StatusBadge({ status }: { status: ReportStatus }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[status]}`}>
      {label}
    </span>
  );
}
