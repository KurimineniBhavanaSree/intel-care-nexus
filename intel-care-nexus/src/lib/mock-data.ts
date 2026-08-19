// Central mock data for MedIntel. Replace with real API calls later.

export const currentUser = {
  name: "Dr. Ananya Sharma",
  email: "ananya.sharma@medintel.io",
  phone: "+91 98765 43210",
  dob: "1992-04-18",
  gender: "Female",
  emergencyContact: "+91 91234 56789",
  role: "Physician",
  avatar: "https://i.pravatar.cc/120?img=47",
};

export const dashboardStats = [
  { label: "Reports Uploaded", value: 124, delta: "+12%", tone: "primary" as const },
  { label: "AI Chats", value: 348, delta: "+27%", tone: "accent" as const },
  { label: "Medical Images", value: 56, delta: "+4%", tone: "primary" as const },
  { label: "Saved Reports", value: 41, delta: "+9%", tone: "accent" as const },
];

export type ReportStatus = "Analyzed" | "Processing" | "Failed" | "Pending";

export interface MedicalReport {
  id: string;
  patient: string;
  type: string;
  date: string;
  status: ReportStatus;
  size: string;
}

export const prescriptionSample = {
  imageAlt: "Handwritten prescription",
  doctor: "Dr. Meera Iyer, MD (General Medicine)",
  date: "2026-07-19",
  medicines: [
    {
      name: "Atorvastatin 10 mg",
      dosage: "1 tablet",
      timing: "Once daily at bedtime",
      duration: "3 months",
      warnings: ["Avoid grapefruit juice", "Report muscle pain immediately"],
      sideEffects: ["Headache", "Nausea", "Muscle aches"],
      interactions: ["Clarithromycin", "Cyclosporine"],
    },
    {
      name: "Metformin 500 mg",
      dosage: "1 tablet",
      timing: "Twice daily with meals",
      duration: "Ongoing",
      warnings: ["Take with food to reduce GI upset"],
      sideEffects: ["Diarrhea", "Metallic taste"],
      interactions: ["Contrast dye (imaging)"],
    },
    {
      name: "Vitamin D3 60,000 IU",
      dosage: "1 capsule",
      timing: "Once weekly",
      duration: "8 weeks",
      warnings: ["Do not exceed prescribed dose"],
      sideEffects: ["Rare at prescribed dose"],
      interactions: [],
    },
  ],
};

export const imageAnalysisSample = {
  condition: "Bacterial Pneumonia (right lower lobe)",
  confidence: 0.918,
  modality: "Chest X-Ray, PA view",
  findings: [
    "Consolidation in the right lower lobe with air bronchograms.",
    "No pleural effusion or pneumothorax identified.",
    "Cardiac silhouette within normal limits.",
  ],
  recommendation:
    "Correlate with clinical symptoms and sputum culture. Consider empirical antibiotic therapy per local guidelines and follow-up radiograph in 4–6 weeks.",
  differentials: [
    { name: "Bacterial Pneumonia", score: 0.918 },
    { name: "Viral Pneumonia", score: 0.62 },
    { name: "Aspiration", score: 0.31 },
    { name: "Pulmonary Edema", score: 0.12 },
  ],
};

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: { title: string; source: string }[];
}

export const chatSeed: ChatMessage[] = [
  {
    id: "m1",
    role: "assistant",
    content:
      "Hello - I'm MedIntel. Ask me about your uploaded reports, medications, or general medical topics. I'll always show the sources I used.",
  },
  {
    id: "m2",
    role: "user",
    content: "What does an elevated LDL mean in a routine lipid panel?",
  },
  {
    id: "m3",
    role: "assistant",
    content:
      "An elevated LDL is generally considered less favorable for cardiovascular risk. The exact interpretation depends on the full report, age, sex, and the laboratory reference range. Common next steps include lifestyle changes, reviewing other risk factors, and discussing follow-up with a clinician if results remain abnormal.",
    citations: [
      { title: "ACC/AHA Cholesterol Guideline 2018", source: "acc.org" },
      { title: "ESC/EAS Dyslipidaemia Guidelines 2019", source: "escardio.org" },
    ],
  },
];

export const suggestedQuestions = [
  "Summarize my latest blood report.",
  "Are any of my medications interacting?",
  "What lifestyle changes reduce LDL fastest?",
  "Explain 'HbA1c' in simple terms.",
];

export const knowledgeArticles = [
  { id: "K-01", title: "WHO Guidelines on Hypertension Management", category: "WHO Guidelines", org: "World Health Organization", date: "2023-09-12", tag: "Cardiology" },
  { id: "K-02", title: "Advances in Non-Invasive Diabetes Monitoring", category: "PubMed", org: "The Lancet", date: "2024-03-04", tag: "Endocrinology" },
  { id: "K-03", title: "Community-Acquired Pneumonia: Diagnostic Update", category: "Medical Article", org: "NEJM", date: "2024-07-22", tag: "Pulmonology" },
  { id: "K-04", title: "AI in Radiology: Explainability Benchmarks", category: "PubMed", org: "Nature Medicine", date: "2025-01-11", tag: "AI / Imaging" },
  { id: "K-05", title: "WHO Physical Activity Guidelines", category: "WHO Guidelines", org: "World Health Organization", date: "2020-11-25", tag: "Preventive" },
  { id: "K-06", title: "Statins and Muscle Symptoms: A Clinical Review", category: "Medical Article", org: "JAMA", date: "2023-05-08", tag: "Cardiology" },
  { id: "K-07", title: "Antibiotic Stewardship in Primary Care", category: "PubMed", org: "BMJ", date: "2024-10-01", tag: "Infectious Disease" },
  { id: "K-08", title: "Retrieval-Augmented Generation for Clinical QA", category: "PubMed", org: "npj Digital Medicine", date: "2025-02-14", tag: "AI / Imaging" },
];

export const knowledgeCategories = ["All", "WHO Guidelines", "PubMed", "Medical Article"];

export const notifications = [
  { id: "n1", title: "Report RPT-2041 analyzed", time: "2m ago", unread: true },
  { id: "n2", title: "New WHO guideline available", time: "1h ago", unread: true },
  { id: "n3", title: "Prescription refill reminder", time: "Yesterday", unread: false },
];
