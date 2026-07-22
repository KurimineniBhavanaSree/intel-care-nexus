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

export const recentReports: MedicalReport[] = [
  { id: "RPT-2041", patient: "Ravi Kumar", type: "Complete Blood Count", date: "2026-07-19", status: "Analyzed", size: "412 KB" },
  { id: "RPT-2040", patient: "Sana Iqbal", type: "MRI — Brain", date: "2026-07-18", status: "Analyzed", size: "8.2 MB" },
  { id: "RPT-2039", patient: "Michael Chen", type: "Lipid Profile", date: "2026-07-18", status: "Processing", size: "298 KB" },
  { id: "RPT-2038", patient: "Priya Nair", type: "Chest X-Ray", date: "2026-07-17", status: "Analyzed", size: "3.1 MB" },
  { id: "RPT-2037", patient: "James O'Neil", type: "Thyroid Panel", date: "2026-07-16", status: "Pending", size: "184 KB" },
  { id: "RPT-2036", patient: "Aditi Verma", type: "HbA1c", date: "2026-07-15", status: "Failed", size: "96 KB" },
  { id: "RPT-2035", patient: "Ravi Kumar", type: "Prescription", date: "2026-07-14", status: "Analyzed", size: "512 KB" },
];

export const sampleAnalysis = {
  patient: {
    name: "Ravi Kumar",
    age: 54,
    gender: "Male",
    patientId: "P-00291",
    referredBy: "Dr. Meera Iyer",
    reportDate: "2026-07-19",
    reportType: "Complete Blood Count + Lipid Profile",
  },
  summary:
    "Blood work indicates borderline dyslipidemia with mildly elevated LDL cholesterol and reduced HDL. Complete blood count is within normal limits. Findings are consistent with early-stage metabolic risk and warrant lifestyle intervention with follow-up in 8–12 weeks.",
  keyFindings: [
    { label: "LDL Cholesterol", value: "142 mg/dL", tone: "warning" as const, note: "Above optimal (<100)" },
    { label: "HDL Cholesterol", value: "38 mg/dL", tone: "warning" as const, note: "Below optimal (>40)" },
    { label: "Triglycerides", value: "168 mg/dL", tone: "warning" as const, note: "Borderline high" },
    { label: "Hemoglobin", value: "14.6 g/dL", tone: "success" as const, note: "Normal" },
    { label: "WBC", value: "7.2 x10³/µL", tone: "success" as const, note: "Normal" },
    { label: "Fasting Glucose", value: "104 mg/dL", tone: "warning" as const, note: "Pre-diabetic range" },
  ],
  diseases: [
    { name: "Dyslipidemia (borderline)", confidence: 0.86 },
    { name: "Impaired Fasting Glucose", confidence: 0.71 },
    { name: "Metabolic Syndrome (early)", confidence: 0.58 },
  ],
  terms: [
    { term: "LDL", meaning: "Low-density lipoprotein — 'bad' cholesterol; high levels raise cardiovascular risk." },
    { term: "HDL", meaning: "High-density lipoprotein — 'good' cholesterol; low levels raise cardiovascular risk." },
    { term: "HbA1c", meaning: "Average blood glucose over the past 2–3 months." },
    { term: "Triglycerides", meaning: "A type of fat in blood; high levels contribute to artery hardening." },
  ],
  recommendations: [
    "Adopt a Mediterranean-style diet emphasizing whole grains, legumes, and omega-3 sources.",
    "150 minutes/week of moderate aerobic activity plus 2 sessions of resistance training.",
    "Recheck lipid panel and fasting glucose in 8–12 weeks.",
    "Consult a physician if LDL remains >130 mg/dL after 12 weeks of lifestyle change.",
  ],
  questions: [
    "What lifestyle changes should I prioritize first?",
    "Do I need medication for cholesterol at this stage?",
    "Which foods should I reduce to lower LDL?",
    "How often should I recheck these labs?",
  ],
  sources: [
    { title: "ACC/AHA Guideline on the Management of Blood Cholesterol", org: "American College of Cardiology", year: 2018 },
    { title: "Standards of Medical Care in Diabetes", org: "American Diabetes Association", year: 2024 },
    { title: "WHO Guidelines on Physical Activity and Sedentary Behaviour", org: "World Health Organization", year: 2020 },
  ],
};

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
      "Hello — I'm MedIntel. Ask me about your uploaded reports, medications, or general medical topics. I'll always show the sources I used.",
  },
  {
    id: "m2",
    role: "user",
    content: "What does an LDL of 142 mg/dL mean for a 54-year-old man?",
  },
  {
    id: "m3",
    role: "assistant",
    content:
      "An LDL of 142 mg/dL is above the optimal range (<100 mg/dL). For a 54-year-old man, especially with any additional risk factors (smoking, family history, hypertension, or diabetes), this places him at borderline-to-moderate cardiovascular risk. First-line intervention is lifestyle modification — Mediterranean diet, 150+ minutes of aerobic activity weekly, and weight management. Statin therapy is considered when LDL remains ≥130 mg/dL after 8–12 weeks of lifestyle change, or sooner if 10-year ASCVD risk is elevated.",
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
