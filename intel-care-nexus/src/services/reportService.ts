import { request } from "@/lib/api";

export type ReportStatus = "pending" | "processing" | "analyzed" | "failed";

export type ProcessingStage =
  | "UPLOADED"
  | "PROCESSING"
  | "FINDINGS_EXTRACTED"
  | "RETRIEVING_EVIDENCE"
  | "GENERATING_ANALYSIS"
  | "COMPLETED"
  | "FAILED";

export type PatientInfo = {
  name?: string | null;
  age?: number | null;
  sex?: string | null;
  patient_id?: string | null;
  report_date?: string | null;
  referring_physician?: string | null;
  report_type?: string | null;
};

export type ReportFinding = {
  test_name: string;
  value: string | number;
  unit?: string | null;
  reference_range?: string | null;
  status: string;
  interpretation?: string | null;
  evidence_ids?: string[];
};

export type EvidenceSource = {
  citation_id: string;
  title: string;
  organization: string;
  year: number;
  source_type: string;
  url: string;
  chunk_id: string;
  excerpt: string;
};

export type ReportCondition = {
  name: string;
  explanation?: string;
  evidence_ids?: string[];
  clinical_correlation_required?: boolean;
  confidence?: number;
};

export type ReportRecommendation = {
  text: string;
  evidence_ids?: string[];
};

export type ReportTerm = {
  term: string;
  definition: string;
  evidence_ids?: string[];
};

export type ReportAnalysisDetail = {
  report_id: number;
  status: string;
  message?: string | null;
  llm_status: string;
  patient_info: PatientInfo;
  summary: string;
  findings: ReportFinding[];
  detected_conditions: ReportCondition[];
  possible_conditions: ReportCondition[];
  recommendations: ReportRecommendation[];
  important_terms: ReportTerm[];
  evidence_sources: EvidenceSource[];
  retrieval_queries: string[];
  processing_stage?: string | null;
  educational_use_only: boolean;
};

export type KeyFinding = {
  label: string;
  value: string;
  tone: "success" | "warning";
  note: string;
};

export type DetectedCondition = {
  name: string;
  confidence: number;
};

export type MedicalReport = {
  id: number;
  user_id: number;
  filename: string;
  file_size: number;
  report_type: string;
  patient_name?: string | null;
  status: ReportStatus;
  processing_stage?: ProcessingStage | string | null;
  summary?: string | null;
  key_findings?: KeyFinding[] | null;
  detected_conditions?: DetectedCondition[] | null;
  recommendations?: string[] | null;
  uploaded_at: string;
  analyzed_at?: string | null;
  processing_message?: string | null;
};

export type UploadResponse = {
  filename: string;
  file_size: number;
  file_path: string;
  upload_id: string;
  status?: string;
};

export const reportService = {
  async uploadReport(
    file: File,
    reportType: string,
    patientName?: string,
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("report_type", reportType);
    if (patientName) {
      formData.append("patient_name", patientName);
    }

    return request<UploadResponse>("/reports/upload", {
      method: "POST",
      body: formData,
    });
  },

  async getReports(): Promise<MedicalReport[]> {
    return request<MedicalReport[]>("/reports");
  },

  async getReport(id: number): Promise<MedicalReport> {
    return request<MedicalReport>(`/reports/${id}`);
  },

  async deleteReport(id: number): Promise<void> {
    await request<void>(`/reports/${id}`, { method: "DELETE" });
  },

  async extractReport(id: number): Promise<Record<string, unknown>> {
    return request<Record<string, unknown>>(`/reports/${id}/extract`, {
      method: "POST",
    });
  },

  async analyzeReport(id: number): Promise<ReportAnalysisDetail> {
    return request<ReportAnalysisDetail>(`/reports/${id}/analyze`, {
      method: "POST",
    });
  },

  async getReportAnalysis(id: number): Promise<ReportAnalysisDetail> {
    return request<ReportAnalysisDetail>(`/reports/${id}/analysis`);
  },

  async getReportSources(id: number): Promise<EvidenceSource[]> {
    return request<EvidenceSource[]>(`/reports/${id}/sources`);
  },

  async getReportFileUrl(id: number): Promise<string> {
    return `${import.meta.env.VITE_API_URL ?? "http://localhost:8001/api/v1"}/reports/${id}/file`;
  },
};
