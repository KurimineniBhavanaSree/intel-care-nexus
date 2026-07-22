import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { UploadCloud, Download, ImageIcon, Sparkles } from "lucide-react";
import { imageAnalysisSample } from "@/lib/mock-data";
import Breadcrumb from "@/components/Breadcrumb";

export const Route = createFileRoute("/dashboard/image")({
  head: () => ({
    meta: [
      { title: "Medical Image Analysis — MedIntel" },
      { name: "description", content: "Analyze X-rays, MRIs, and CT scans with AI. Get detected conditions, confidence scores, and recommendations." },
      { property: "og:title", content: "Medical Image Analysis — MedIntel" },
      { property: "og:description", content: "Explainable AI for radiology images." },
    ],
  }),
  component: ImagePage,
});

function ImagePage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzed, setAnalyzed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const a = imageAnalysisSample;

  const onFile = (f: File | undefined) => {
    if (!f) return;
    setPreview(URL.createObjectURL(f));
    setAnalyzed(false);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Dashboard", to: "/dashboard" }, { label: "Medical Image" }]} />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Medical Image Analysis</h1>
        <p className="mt-1 text-sm text-muted-foreground">Upload chest X-rays, MRIs or CT slices for AI-assisted interpretation.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-soft p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Upload Image</h2>
          <div className="mt-3">
            {preview ? (
              <div className="relative overflow-hidden rounded-xl bg-black">
                <img src={preview} alt="Uploaded medical" className="mx-auto max-h-96 object-contain" />
              </div>
            ) : (
              <div
                onClick={() => inputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-14 text-center hover:border-primary hover:bg-primary-soft"
              >
                <span className="grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary"><ImageIcon size={26} /></span>
                <div className="text-sm font-semibold">Click to upload or drag & drop</div>
                <div className="text-xs text-muted-foreground">PNG, JPG, DICOM · up to 20 MB</div>
              </div>
            )}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => inputRef.current?.click()} className="btn-outline flex-1"><UploadCloud size={16} /> Choose image</button>
            <button
              disabled={!preview}
              onClick={() => setAnalyzed(true)}
              className="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
            ><Sparkles size={16} /> Analyze</button>
          </div>
        </div>

        <div className="card-soft p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Analysis Result</h2>
            {analyzed && <button className="btn-outline"><Download size={14} /> Download</button>}
          </div>

          {!analyzed ? (
            <div className="mt-8 flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-muted-foreground">
              <Sparkles size={22} className="text-primary" />
              Upload an image and click Analyze to see AI-generated interpretation.
            </div>
          ) : (
            <div className="mt-4 space-y-5">
              <div className="rounded-xl bg-primary-soft p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-primary">Detected Condition</div>
                <div className="mt-1 text-lg font-bold">{a.condition}</div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-background">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${a.confidence * 100}%` }} />
                  </div>
                  <span className="font-mono text-xs font-bold">{(a.confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">Modality: {a.modality}</div>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Findings</div>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {a.findings.map((f) => <li key={f} className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />{f}</li>)}
                </ul>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Differential Diagnosis</div>
                <div className="mt-2 space-y-2">
                  {a.differentials.map((d) => (
                    <div key={d.name}>
                      <div className="flex justify-between text-xs">
                        <span className="font-medium">{d.name}</span>
                        <span className="font-mono text-muted-foreground">{(d.score * 100).toFixed(0)}%</span>
                      </div>
                      <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${d.score * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/50 p-4 text-sm">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recommendation</div>
                <p className="mt-1 leading-relaxed">{a.recommendation}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
