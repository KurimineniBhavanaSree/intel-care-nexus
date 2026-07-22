import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState, type DragEvent } from "react";
import { UploadCloud, FileText, Eye, Trash2, CheckCircle2 } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";

export const Route = createFileRoute("/dashboard/upload")({
  head: () => ({
    meta: [
      { title: "Upload Report — MedIntel" },
      { name: "description", content: "Upload PDF, DOCX, or TXT medical reports for AI-powered analysis." },
      { property: "og:title", content: "Upload Report — MedIntel" },
      { property: "og:description", content: "Drag & drop your medical reports for AI analysis." },
    ],
  }),
  component: UploadPage,
});

interface UploadItem {
  id: string;
  name: string;
  size: string;
  progress: number;
  status: "uploading" | "done";
}

const initial: UploadItem[] = [
  { id: "u1", name: "cbc_report_july.pdf", size: "412 KB", progress: 100, status: "done" },
  { id: "u2", name: "mri_brain.docx", size: "1.2 MB", progress: 100, status: "done" },
];

function UploadPage() {
  const [files, setFiles] = useState<UploadItem[]>(initial);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const simulateUpload = (name: string, size: string) => {
    const id = `u${Date.now()}`;
    setFiles((f) => [{ id, name, size, progress: 0, status: "uploading" }, ...f]);
    let p = 0;
    const interval = setInterval(() => {
      p += Math.round(Math.random() * 18 + 6);
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setProgress(0);
        setFiles((prev) => prev.map((it) => it.id === id ? { ...it, progress: 100, status: "done" } : it));
      } else {
        setProgress(p);
        setFiles((prev) => prev.map((it) => it.id === id ? { ...it, progress: p } : it));
      }
    }, 220);
  };

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    Array.from(list).forEach((f) => {
      const kb = f.size / 1024;
      simulateUpload(f.name, kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`);
    });
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Dashboard", to: "/dashboard" }, { label: "Upload Report" }]} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload a Medical Report</h1>
        <p className="mt-1 text-sm text-muted-foreground">Drag & drop your files or browse. Supported formats: PDF, DOCX, TXT.</p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
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
          <div className="text-xs text-muted-foreground">PDF, DOCX, TXT · up to 20 MB per file</div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <button type="button" onClick={() => inputRef.current?.click()} className="btn-primary mt-2">Browse files</button>

        {progress > 0 && (
          <div className="mt-4 w-full max-w-md">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Uploading…</span><span>{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

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
                <th className="px-5 py-3">Progress</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-primary" />
                      <span className="font-medium">{f.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{f.size}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${f.progress}%` }} />
                      </div>
                      {f.status === "done"
                        ? <CheckCircle2 size={14} className="text-accent" />
                        : <span className="text-xs text-muted-foreground">{f.progress}%</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Link to="/dashboard/analysis" className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted" aria-label="Preview">
                        <Eye size={14} />
                      </Link>
                      <button
                        onClick={() => setFiles((prev) => prev.filter((x) => x.id !== f.id))}
                        className="grid h-8 w-8 place-items-center rounded-md text-destructive hover:bg-destructive/10"
                        aria-label="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {files.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-muted-foreground">No files uploaded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
