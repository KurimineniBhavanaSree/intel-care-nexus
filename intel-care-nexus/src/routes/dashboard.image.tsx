import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Download, ImageIcon, Sparkles, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import Breadcrumb from "@/components/Breadcrumb";
import { ApiError } from "@/lib/api";
import {
  fetchImagePreviewUrl,
  imageService,
  type MedicalImage,
  type MedicalImageAnalysis,
} from "@/services/imageService";

export const Route = createFileRoute("/dashboard/image")({
  head: () => ({
    meta: [
      { title: "Medical Image Analysis — MedIntel" },
      {
        name: "description",
        content: "Upload and review medical images from your authenticated MedIntel account.",
      },
      { property: "og:title", content: "Medical Image Analysis — MedIntel" },
      { property: "og:description", content: "Explainable image workflow for authenticated users." },
    ],
  }),
  component: ImagePage,
});

const MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024;

function ImagePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewCleanupRef = useRef<string | null>(null);
  const [images, setImages] = useState<MedicalImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<MedicalImage | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);
  const [pendingFileName, setPendingFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<MedicalImageAnalysis | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadImages = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        const data = await imageService.getImages();
        if (!active) return;
        setImages(data);
        if (data.length > 0) {
          await selectImage(data[0], false);
        } else {
          setSelectedImage(null);
          setSelectedPreview(null);
          setAnalysis(null);
        }
      } catch (err) {
        if (!active) return;
        const message = err instanceof ApiError || err instanceof Error ? err.message : "Failed to load images";
        setErrorMessage(message);
        toast.error(message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadImages();

    return () => {
      active = false;
      if (previewCleanupRef.current) {
        URL.revokeObjectURL(previewCleanupRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewCleanupRef.current) {
        URL.revokeObjectURL(previewCleanupRef.current);
      }
    };
  }, []);

  const setPreviewUrl = (url: string | null) => {
    if (previewCleanupRef.current) {
      URL.revokeObjectURL(previewCleanupRef.current);
      previewCleanupRef.current = null;
    }
    if (url) {
      previewCleanupRef.current = url;
    }
    setSelectedPreview(url);
  };

  const selectImage = async (image: MedicalImage, keepAnalysis = true) => {
    setSelectedImage(image);
    if (!keepAnalysis) {
      setAnalysis(null);
    }

    try {
      const previewUrl = await fetchImagePreviewUrl(image.id);
      setPreviewUrl(previewUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load preview";
      setErrorMessage(message);
      toast.error(message);
      setPreviewUrl(null);
    }
  };

  const refreshImages = async (focusImageId?: number, keepAnalysis = false) => {
    setErrorMessage(null);
    const data = await imageService.getImages();
    setImages(data);

    if (focusImageId) {
      const focused = data.find((item) => item.id === focusImageId) ?? data[0] ?? null;
      if (focused) {
        await selectImage(focused, keepAnalysis);
      }
      return;
    }

    if (data.length > 0) {
      await selectImage(data[0], keepAnalysis);
    } else {
      setSelectedImage(null);
      setPreviewUrl(null);
      setAnalysis(null);
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) {
      const message = "No image file was selected.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    const lowerName = file.name.toLowerCase();
    const isImageMime = file.type.startsWith("image/");
    const isDicomFile = lowerName.endsWith(".dcm") || lowerName.endsWith(".dicom");
    if (!isImageMime && !isDicomFile) {
      const message = "Please choose a valid medical image file.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      const message = "Image is too large. Maximum allowed size is 20 MB.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    setPendingFileName(file.name);
    setUploading(true);
    setErrorMessage(null);
    try {
      const saved = await imageService.uploadImage(file);
      toast.success("Image uploaded successfully");
      await refreshImages(saved.id, false);
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : "Upload failed";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setUploading(false);
      setPendingFileName(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const runAnalysis = async () => {
    if (!selectedImage || uploading || analyzing) {
      if (!selectedImage) {
        const message = "Please choose an image before analyzing.";
        setErrorMessage(message);
        toast.error(message);
      }
      return;
    }

    setAnalyzing(true);
    setErrorMessage(null);
    setAnalysis(null);
    try {
      const result = await imageService.analyzeImage(selectedImage.id);
      setAnalysis(result);
      toast.success("Analysis completed");
      await refreshImages(selectedImage.id, true);
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : "Analysis failed";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setAnalyzing(false);
    }
  };

  const activeImage = selectedImage;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Dashboard", to: "/dashboard" }, { label: "Medical Image" }]} />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Medical Image Analysis</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload medical images from your account and review the saved records from PostgreSQL.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-soft p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Upload Image</h2>

          <div className="mt-3">
            {selectedPreview ? (
              <div className="overflow-hidden rounded-xl bg-black">
                <img
                  src={selectedPreview}
                  alt={activeImage?.original_filename ?? "Uploaded medical image"}
                  className="mx-auto max-h-96 w-full object-contain"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-14 text-center transition hover:border-primary hover:bg-primary-soft"
              >
                <span className="grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary">
                  <ImageIcon size={26} />
                </span>
                <div className="text-sm font-semibold">Click to upload an image</div>
                <div className="text-xs text-muted-foreground">PNG, JPG, JPEG, DICOM, DCM · up to 20 MB</div>
              </button>
            )}

            <input
              ref={inputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.dcm,.dicom,image/*"
              className="hidden"
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="btn-outline flex-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <UploadCloud size={16} />
              {uploading ? "Uploading..." : "Choose Image"}
            </button>
            <button
              type="button"
              disabled={!selectedImage || uploading || analyzing}
              onClick={() => void runAnalysis()}
              className="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles size={16} />
              {analyzing ? "Analyzing..." : "Analyze"}
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4 text-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current file</div>
            <div className="mt-1 font-medium">
              {pendingFileName
                ? pendingFileName
                : activeImage?.original_filename ?? "No image selected yet"}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {activeImage
                ? `Status: ${activeImage.analysis_status ?? activeImage.status}`
                : "Upload an image to store it in PostgreSQL and make it available after refresh."}
            </div>
            {errorMessage && (
              <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-700">
                {errorMessage}
              </div>
            )}
          </div>
        </div>

        <div className="card-soft p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Analysis Result</h2>
            <button
              type="button"
              disabled={!selectedPreview}
              onClick={() => selectedPreview && window.open(selectedPreview, "_blank", "noopener,noreferrer")}
              className="btn-outline disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={14} />
              Preview
            </button>
          </div>

          {!activeImage ? (
            <div className="mt-8 flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-muted-foreground">
              <Sparkles size={22} className="text-primary" />
              {loading ? "Loading your uploaded images..." : "No uploaded images found for this account."}
            </div>
          ) : (
            <div className="mt-4 space-y-5">
              <div className="rounded-xl bg-primary-soft p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-primary">Upload status</div>
                <div className="mt-1 text-lg font-bold">
                  {analyzing ? "Processing" : activeImage.analysis_status ?? activeImage.status}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Uploaded on {new Date(activeImage.uploaded_at).toLocaleString()}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  File size: {(activeImage.file_size / (1024 * 1024)).toFixed(2)} MB
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Selected image</div>
                <div className="mt-1 text-sm font-medium">{activeImage.original_filename ?? activeImage.filename}</div>
                <div className="mt-1 text-xs text-muted-foreground">{activeImage.mime_type ?? "Unknown MIME type"}</div>
              </div>

              <div className="rounded-xl border border-border bg-background p-4 text-sm">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pipeline response</div>
                {analysis ? (
                  <div className="mt-2 space-y-2">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Prediction</div>
                      <div className="font-medium">{analysis.prediction}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Confidence</div>
                      <div className="font-medium">{analysis.confidence.toFixed(2)}%</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Status</div>
                      <div className="font-medium">{analysis.analysis_status}</div>
                    </div>
                    {analysis.message && (
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Message</div>
                        <p className="mt-1 leading-relaxed text-muted-foreground">{analysis.message}</p>
                      </div>
                    )}
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Summary</div>
                      <p className="mt-1 leading-relaxed text-muted-foreground">{analysis.summary}</p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-muted-foreground">
                    {analyzing
                      ? "Processing the selected image..."
                      : "Click Analyze to send the uploaded image to the backend model and receive a prediction."}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card-soft p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Your Uploaded Images</h2>
          <span className="text-xs text-muted-foreground">{images.length} saved record(s)</span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {images.map((image) => (
            <button
            key={image.id}
            type="button"
            onClick={() => void selectImage(image, false)}
              className={`rounded-xl border p-4 text-left transition ${
                selectedImage?.id === image.id
                  ? "border-primary bg-primary-soft"
                  : "border-border bg-background hover:border-primary/60 hover:bg-muted/40"
              }`}
            >
              <div className="text-sm font-semibold">{image.original_filename ?? image.filename}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {image.analysis_status ?? image.status} · {new Date(image.uploaded_at).toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {(image.file_size / 1024).toFixed(1)} KB · {image.mime_type ?? "unknown MIME"}
              </div>
            </button>
          ))}

          {!loading && images.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              No medical images have been uploaded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
