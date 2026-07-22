import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FileText, Pill, Image as ImgIcon, MessageSquare, ShieldCheck, Sparkles,
  ArrowRight, Activity, Database, Cpu, Server, Search, Layers, BookOpenCheck,
  CheckCircle2, Stethoscope,
} from "lucide-react";
import LandingNav from "@/components/LandingNav";
import Footer from "@/components/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MedIntel — Explainable AI Healthcare Assistant" },
      { name: "description", content: "Upload medical reports, prescriptions and images. Get AI-powered summaries and trusted, cited medical insights using Retrieval-Augmented Generation." },
      { property: "og:title", content: "MedIntel — Explainable AI Healthcare Assistant" },
      { property: "og:description", content: "AI-powered analysis of medical reports, prescriptions, and images with cited sources." },
    ],
  }),
  component: LandingPage,
});

const features = [
  { icon: FileText, title: "Medical Report Analysis", desc: "Structured summaries of blood work, imaging, and pathology reports with key findings highlighted." },
  { icon: Pill, title: "Prescription Analysis", desc: "Extract medicines, dosage, timing, warnings, side effects, and interactions from prescriptions." },
  { icon: ImgIcon, title: "Medical Image Analysis", desc: "Detect conditions in X-rays, MRIs, and CT scans with confidence scores and differential diagnoses." },
  { icon: MessageSquare, title: "AI Healthcare Chatbot", desc: "Ask questions in natural language and receive concise, sourced answers grounded in your reports." },
  { icon: BookOpenCheck, title: "Trusted Knowledge Retrieval", desc: "Answers backed by WHO guidelines, peer-reviewed literature, and curated medical corpora." },
  { icon: ShieldCheck, title: "Explainable AI", desc: "Every insight shows the evidence, sources, and confidence — never a black box." },
];

const techStack = [
  { icon: Layers, name: "React", desc: "Modern component-driven UI" },
  { icon: Server, name: "FastAPI", desc: "High-performance Python API layer" },
  { icon: Database, name: "PostgreSQL", desc: "Structured clinical & user data" },
  { icon: Search, name: "RAG", desc: "Retrieval-Augmented Generation pipeline" },
  { icon: Cpu, name: "FAISS", desc: "Vector similarity search at scale" },
  { icon: Sparkles, name: "LLM", desc: "Large language model for reasoning" },
  { icon: Activity, name: "Sentence Transformers", desc: "Semantic embeddings for clinical text" },
  { icon: ShieldCheck, name: "Explainability", desc: "Citations & confidence for every answer" },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-soft via-background to-accent-soft opacity-70" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24 lg:px-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles size={12} /> Powered by RAG + LLM
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              AI Powered <span className="text-primary">Healthcare</span> Assistant
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Upload medical reports, prescriptions, and medical images to receive AI-powered summaries and trusted medical insights using Retrieval-Augmented Generation.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="btn-primary">
                Get Started <ArrowRight size={16} />
              </Link>
              <a href="#features" className="btn-outline">Learn More</a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-accent" /> HIPAA-conscious design</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-accent" /> Cited evidence</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-accent" /> Multimodal</span>
            </div>
          </div>

          <div className="relative">
            <div className="card-soft relative overflow-hidden p-6 shadow-elevated">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground"><Stethoscope size={16} /></span>
                <div>
                  <div className="text-sm font-semibold">Report Analysis</div>
                  <div className="text-xs text-muted-foreground">CBC + Lipid Panel · Ravi Kumar</div>
                </div>
                <span className="ml-auto rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent">ANALYZED</span>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground">SUMMARY</div>
                  <p className="mt-1 leading-relaxed">Borderline dyslipidemia with mildly elevated LDL and reduced HDL. CBC within normal limits. Recommend lifestyle intervention with 8–12 week follow-up.</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { k: "LDL", v: "142", u: "mg/dL", tone: "warning" },
                    { k: "HDL", v: "38", u: "mg/dL", tone: "warning" },
                    { k: "Hgb", v: "14.6", u: "g/dL", tone: "success" },
                  ].map((m) => (
                    <div key={m.k} className="rounded-lg border border-border p-2.5">
                      <div className="text-[10px] font-semibold text-muted-foreground">{m.k}</div>
                      <div className="mt-0.5 text-base font-bold">{m.v} <span className="text-[10px] font-medium text-muted-foreground">{m.u}</span></div>
                      <div className={`mt-0.5 text-[10px] font-semibold ${m.tone === "warning" ? "text-warning-foreground" : "text-accent"}`}>{m.tone === "warning" ? "High" : "Normal"}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground">SOURCES</div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {["ACC/AHA 2018", "WHO 2020", "ADA 2024"].map((s) => (
                      <span key={s} className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 -z-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -top-4 -left-4 -z-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-background py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Features</span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Everything a clinician needs, in one workspace</h2>
            <p className="mt-3 text-muted-foreground">Multimodal understanding across text, images, and structured labs — always with citations.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="card-soft p-6 transition-shadow hover:shadow-elevated">
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary-soft text-primary">
                    <Icon size={20} />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Technology */}
      <section id="technology" className="border-t border-border bg-card py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-accent">Technology</span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Built on a modern, explainable stack</h2>
            <p className="mt-3 text-muted-foreground">A production-grade architecture combining retrieval, embeddings, and reasoning.</p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {techStack.map((t) => {
              const Icon = t.icon;
              return (
                <div key={t.name} className="rounded-xl border border-border bg-background p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent-soft text-accent"><Icon size={18} /></span>
                  <div className="mt-3 text-base font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="border-t border-border py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">About MedIntel</span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Bringing explainability to clinical AI</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              MedIntel combines large language models with a curated medical knowledge base to help patients and clinicians understand reports, prescriptions and images. Every insight is grounded in retrievable evidence and includes citations — no black boxes.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              {[
                "Multimodal ingestion: PDFs, DOCX, images, and DICOM previews",
                "Grounded answers with retrievable citations",
                "Structured summaries designed for clinical review",
                "Designed with privacy and auditability in mind",
              ].map((p) => (
                <li key={p} className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5 text-accent" /><span>{p}</span></li>
              ))}
            </ul>
          </div>
          <div className="card-soft grid grid-cols-2 gap-4 p-6">
            {[
              { k: "Reports analyzed", v: "12,400+" },
              { k: "Cited sources", v: "38,000+" },
              { k: "Modalities", v: "5" },
              { k: "Avg. response", v: "1.8s" },
            ].map((s) => (
              <div key={s.k} className="rounded-xl bg-muted p-5">
                <div className="text-2xl font-extrabold text-primary">{s.v}</div>
                <div className="text-xs font-medium text-muted-foreground">{s.k}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
