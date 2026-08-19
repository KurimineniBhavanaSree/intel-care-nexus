import { API_BASE_URL, clearAuthTokens, getAccessToken, request } from "@/lib/api";

export type MedicalImage = {
  id: number;
  user_id: number;
  filename: string;
  original_filename?: string | null;
  stored_filename?: string | null;
  file_path: string;
  file_size: number;
  mime_type?: string | null;
  image_type: string;
  status: string;
  analysis_status?: string | null;
  detected_condition?: string | null;
  confidence?: number | null;
  findings?: string[] | null;
  uploaded_at: string;
  upload_time?: string | null;
  analyzed_at?: string | null;
  created_at?: string | null;
  preview_url?: string | null;
};

export type MedicalImageAnalysis = {
  success: boolean;
  prediction: string;
  confidence: number;
  summary: string;
  message?: string | null;
  analysis_status: string;
  image_id: number;
  detected_condition?: string | null;
  predicted_probability?: number | null;
  threshold?: number | null;
  class_names?: string[] | null;
  findings?: string[] | null;
  recommendations?: string[] | null;
};

export async function fetchImagePreviewUrl(imageId: number): Promise<string> {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE_URL}/images/${imageId}/file`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthTokens();
      window.location.href = "/login";
    }
    throw new Error("Failed to load image preview");
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export const imageService = {
  async getImages(): Promise<MedicalImage[]> {
    return request<MedicalImage[]>("/images");
  },

  async uploadImage(file: File, imageType = "General"): Promise<MedicalImage> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("image_type", imageType);

    return request<MedicalImage>("/images/upload", {
      method: "POST",
      body: formData,
    });
  },

  async analyzeImage(imageId: number): Promise<MedicalImageAnalysis> {
    return request<MedicalImageAnalysis>(`/images/${imageId}/analyze`, {
      method: "POST",
    });
  },

  async deleteImage(imageId: number): Promise<void> {
    await request<void>(`/images/${imageId}`, { method: "DELETE" });
  },
};
