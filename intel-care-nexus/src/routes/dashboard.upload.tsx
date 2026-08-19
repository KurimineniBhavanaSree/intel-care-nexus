import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { CheckCircle2, FileText, Eye, Loader2, Trash2, UploadCloud } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import StatusBadge from "@/components/StatusBadge";
import { reportService, type MedicalReport } from "@/services/reportService";

export const Route = createFileRoute("/dashboard/upload")({
  head: () => ({
    meta: [
      { title: "Upload Report - MedIntel" },
      { name: "description", content: "Upload PDF, DOCX, or TXT medical reports for analysis." },
      { property: "og:title", content: "Upload Report - MedIntel" },
      { property: "og:description", content: "Upload your medical reports for real analysis." },
    ],
  }),
  component: UploadPage,
});

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes)) return "Unknown size";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function UploadPage() {
  const [files, setFiles] = useState<MedicalReport[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const reports = await reportService.getReports();
      setFiles(reports);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReports();
  }, []);

  const handleUpload = async (list: FileList | null) => {
    if (!list || list.length === 0) return;

    const accepted = Array.from(list).filter((file) =>
      [".pdf", ".docx", ".txt"].some((ext) => file.name.toLowerCase().endsWith(ext)),
    );

    if (accepted.length === 0) {
      setError("Unsupported file format.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      for (const file of accepted) {
        await reportService.uploadReport(file, "General");
      }
      await loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload report.");
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    void handleUpload(e.dataTransfer.files);
  };

  const rows = useMemo(() => files, [files]);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Dashboard", to: "/dashboard" }, { label: "Upload Report" }]} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload a Medical Report</h1>
        <p className="mt-1 text-sm text-muted-foreground">Drag and drop files or browse. Supported formats: PDF, DOCX, TXT.</p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`card-soft flex flex-col items-center justify-center gap-3 border-2 border-dashed p-12 text-center transition-colors ${
          dragOver ? "border-primary bg-primary-soft" : "border-border"
        }`}
      >
        <span className="grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary">
          <UploadCloud size={26} />
        </span>
        <div>
          <div className="text-base font-semibold">Drop files here to upload</div>
          <div className="text-xs text-muted-foreground">PDF, DOCX, TXT - up to 20 MB per file</div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          multiple
          onChange={(e) => void handleUpload(e.target.files)}
          className="hidden"
        />
        <button type="button" onClick={() => inputRef.current?.click()} className="btn-primary mt-2">
          Browse files
        </button>

        {uploading && (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={14} className="animate-spin" />
            Uploading and indexing report...
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="card-soft overflow-hidden">
        <div className="border-b border-border p-5">
          <h2 className="text-base font-semibold">Uploaded Files</h2>
          <p className="text-xs text-muted-foreground">Preview, delete, or analyze your uploads.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3">File</th>
                <th className="px-5 py-3">Size</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-muted-foreground">
                    Loading uploaded reports...
                  </td>
                </tr>
              )}
              {!loading && rows.map((report) => (
                <tr key={report.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-primary" />
                      <div>
                        <div className="font-medium">{report.filename}</div>
                        <div className="text-xs text-muted-foreground">{report.report_type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{formatFileSize(report.file_size)}</td>
                  <td className="px-5 py-3">
                    <div className="space-y-1">
                      <StatusBadge status={report.status} />
                      {report.processing_stage && (
                        <div className="text-[11px] text-muted-foreground">{report.processing_stage}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Link
                        to="/dashboard/analysis"
                        search={{ reportId: report.id }}
                        className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"
                        aria-label="Preview"
                      >
                        <Eye size={14} />
                      </Link>
                      <button
                        onClick={async () => {
                          try {
                            await reportService.deleteReport(report.id);
                            await loadReports();
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
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-muted-foreground">
                    No files uploaded yet.
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
