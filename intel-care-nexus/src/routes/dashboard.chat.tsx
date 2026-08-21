import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useEffect, type ReactNode } from "react";
import { Send, Trash2, Sparkles, BookOpen, Bot, User, Loader2 } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import { reportService } from "@/services/reportService";
import { imageService } from "@/services/imageService";
import { chatService, type ChatMessage, type ChatResponse } from "@/services/chatService";

function renderMarkdown(text: string): ReactNode {
  const blocks = text.split(/\n{2,}/);
  const elements: ReactNode[] = [];
  let key = 0;

  for (const block of blocks) {
    const lines = block.split("\n");
    const listItems: string[] = [];
    let paragraph = "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("# ")) {
        if (listItems.length || paragraph) {
          elements.push(<p key={key++} className="mb-2">{renderInline(paragraph)}</p>);
          paragraph = "";
        }
        elements.push(<h1 key={key++} className="mb-1 text-base font-bold">{trimmed.slice(2)}</h1>);
      } else if (trimmed.startsWith("## ")) {
        if (listItems.length || paragraph) {
          elements.push(<p key={key++} className="mb-2">{renderInline(paragraph)}</p>);
          paragraph = "";
        }
        elements.push(<h2 key={key++} className="mb-1 text-sm font-bold">{trimmed.slice(3)}</h2>);
      } else if (trimmed.startsWith("### ")) {
        if (listItems.length || paragraph) {
          elements.push(<p key={key++} className="mb-2">{renderInline(paragraph)}</p>);
          paragraph = "";
        }
        elements.push(<h3 key={key++} className="mb-1 text-xs font-bold uppercase tracking-wider">{trimmed.slice(4)}</h3>);
      } else if (/^[-*]\s/.test(trimmed)) {
        if (paragraph) {
          elements.push(<p key={key++} className="mb-2">{renderInline(paragraph)}</p>);
          paragraph = "";
        }
        listItems.push(trimmed.replace(/^[-*]\s+/, ""));
      } else if (/^\d+\.\s/.test(trimmed)) {
        if (paragraph) {
          elements.push(<p key={key++} className="mb-2">{renderInline(paragraph)}</p>);
          paragraph = "";
        }
        listItems.push(trimmed.replace(/^\d+\.\s+/, ""));
      } else {
        if (listItems.length) {
          elements.push(
            <ul key={key++} className="mb-2 list-disc pl-4 space-y-1">
              {listItems.map((item, i) => (
                <li key={i}>{renderInline(item)}</li>
              ))}
            </ul>
          );
          listItems.length = 0;
        }
        paragraph += (paragraph ? " " : "") + trimmed;
      }
    }

    if (listItems.length) {
      elements.push(
        <ul key={key++} className="mb-2 list-disc pl-4 space-y-1">
          {listItems.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ul>
      );
    }
    if (paragraph) {
      elements.push(<p key={key++} className="mb-2">{renderInline(paragraph)}</p>);
    }
  }

  return elements;
}

function renderInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

export const Route = createFileRoute("/dashboard/chat")({
  head: () => ({
    meta: [
      { title: "AI Chat — MedIntel" },
      { name: "description", content: "Chat with MedIntel — an AI assistant that answers medical questions with cited sources." },
      { property: "og:title", content: "AI Chat — MedIntel" },
      { property: "og:description", content: "Cited AI answers for medical questions." },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [reports, setReports] = useState<Array<{ id: number; filename: string; report_type: string; analyzed_at?: string }>>([]);
  const [images, setImages] = useState<Array<{ id: number; filename: string; image_type: string; analysis_status?: string }>>([]);
  const [selectedReportId, setSelectedReportId] = useState<number | undefined>(undefined);
  const [selectedImageId, setSelectedImageId] = useState<number | undefined>(undefined);
  const [loadingContext, setLoadingContext] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, suggestions]);

  useEffect(() => {
    let active = true;
    setLoadingContext(true);
    Promise.all([
      reportService.getReports().catch(() => [] as any[]),
      imageService.getImages().catch(() => [] as any[]),
    ]).then(([reportsData, imagesData]) => {
      if (!active) return;
      setReports(reportsData || []);
      setImages(imagesData || []);
    }).finally(() => {
      if (active) setLoadingContext(false);
    });
    return () => { active = false; };
  }, []);

  const selectedContextLabel = (() => {
    if (selectedReportId !== undefined) {
      const r = reports.find((x) => x.id === selectedReportId);
      return r ? `${r.filename} — ${r.report_type}${r.analyzed_at ? ` (${new Date(r.analyzed_at).toLocaleDateString()})` : ""}` : undefined;
    }
    if (selectedImageId !== undefined) {
      const img = images.find((x) => x.id === selectedImageId);
      return img ? `${img.filename} — ${img.image_type}${img.analysis_status ? ` (${img.analysis_status})` : ""}` : undefined;
    }
    return undefined;
  })();

  const getInitialSuggestions = () => {
    if (selectedReportId !== undefined) {
      const report = reports.find((r) => r.id === selectedReportId);
      const type = (report?.report_type || "").toLowerCase();
      if (type.includes("glucose") || type.includes("blood sugar") || type.includes("diabetes")) {
        return [
          "Summarize my report",
          "What abnormalities were found?",
          "Are my values in the normal range?",
          "What should I discuss with my doctor?",
        ];
      }
      if (type.includes("lipid") || type.includes("cholesterol")) {
        return [
          "Summarize my lipid profile",
          "What abnormalities were found?",
          "Explain the abnormal findings",
          "What should I discuss with my doctor?",
        ];
      }
      if (type.includes("cbc") || type.includes("blood count")) {
        return [
          "Summarize my CBC report",
          "What abnormalities were found?",
          "Explain the abnormal findings",
          "What should I discuss with my doctor?",
        ];
      }
      return [
        "Summarize my report",
        "What abnormalities were found?",
        "Explain the abnormal findings",
        "What should I discuss with my doctor?",
      ];
    }
    if (selectedImageId !== undefined) {
      return [
        "What findings were identified?",
        "What does this finding mean?",
        "Explain this in simple terms",
        "What should I ask my doctor?",
      ];
    }
    return [];
  };

  useEffect(() => {
    if (messages.length === 0 && selectedContextLabel) {
      setSuggestions(getInitialSuggestions());
    } else if (messages.length === 0) {
      setSuggestions([]);
    }
  }, [selectedReportId, selectedImageId, messages.length]);

  const send = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSuggestions([]);
    setTyping(true);

    try {
      const data = await chatService.sendMessage({
        content: text,
        report_id: selectedReportId,
        image_id: selectedImageId,
      });
      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: data.message.content,
        citations: data.message.citations || data.citations,
        created_at: data.message.created_at,
      };
      setMessages((m) => [...m, assistantMsg]);
      setSuggestions(data.follow_up_questions || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to get response.";
      setMessages((m) => [...m, {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: `Error: ${message}`,
        citations: [],
      }]);
      setSuggestions([]);
    } finally {
      setTyping(false);
    }
  };

  const clear = () => {
    setMessages([]);
    setSuggestions([]);
  };

  const lastCitations = [...messages].reverse().find((m) => m.role === "assistant" && m.citations && m.citations.length > 0)?.citations || [];
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "Dashboard", to: "/dashboard" }, { label: "AI Chat" }]} />

      <div className="grid gap-4 lg:grid-cols-4">
        {/* Chat panel */}
        <div className="card-soft flex h-[calc(100vh-11rem)] flex-col lg:col-span-3">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground"><Sparkles size={16} /></span>
              <div>
                <div className="text-sm font-bold">MedIntel Assistant</div>
                <div className="text-[11px] text-muted-foreground">Cited answers · always verify with your clinician</div>
              </div>
            </div>
            <button onClick={clear} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted"><Trash2 size={13} /> Clear</button>
          </div>

          {selectedContextLabel && (
            <div className="border-b border-border bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
              Context: <span className="font-semibold text-foreground">{selectedContextLabel}</span>
            </div>
          )}

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 && !typing && (
              <div className="flex h-full items-center justify-center">
                <div className="max-w-md text-center text-sm text-muted-foreground">
                  {selectedContextLabel
                    ? <>Select a report or image above, then ask a question to get started.</>
                    : <>Select a medical report or image to begin. Your selection will become the active context for this conversation.</>}
                </div>
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${m.role === "user" ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"}`}>
                  {m.role === "user" ? <User size={14} /> : <Bot size={14} />}
                </span>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <div className="prose-sm">{m.role === "assistant" ? renderMarkdown(m.content) : m.content}</div>
                  {m.citations && m.citations.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {m.citations.map((c, idx) => (
                        <span key={idx} className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-semibold text-foreground">
                          {c.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground"><Bot size={14} /></span>
                <div className="rounded-2xl bg-muted px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                  </div>
                </div>
              </div>
            )}

            {!typing && suggestions.length > 0 && lastAssistant && (
              <div className="space-y-2">
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Suggested questions</div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => send(s)}
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!typing && messages.length === 0 && suggestions.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Suggested questions</div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => send(s)}
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="border-t border-border p-3">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {loadingContext ? (
                <span className="rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground">
                  <Loader2 size={12} className="inline mr-1 animate-spin" /> Loading...
                </span>
              ) : (
                <>
                  <select
                    value={selectedReportId ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedReportId(val ? Number(val) : undefined);
                      if (val) setSelectedImageId(undefined);
                      setSuggestions([]);
                    }}
                    className="h-8 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-ring"
                  >
                    <option value="">Select report...</option>
                    {reports.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.filename} — {r.report_type} {r.analyzed_at ? `(${new Date(r.analyzed_at).toLocaleDateString()})` : ""}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedImageId ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedImageId(val ? Number(val) : undefined);
                      if (val) setSelectedReportId(undefined);
                      setSuggestions([]);
                    }}
                    className="h-8 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-ring"
                  >
                    <option value="">Select image...</option>
                    {images.map((img) => (
                      <option key={img.id} value={img.id}>
                        {img.filename} — {img.image_type} {img.analysis_status ? `(${img.analysis_status})` : ""}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your reports, medications, or a medical topic…"
                className="h-11 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
              <button type="submit" className="btn-primary h-11 px-4"><Send size={16} /></button>
            </form>
          </div>
        </div>

        {/* Citation panel */}
        <div className="card-soft p-4">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
            <BookOpen size={14} /> Citations
          </div>
          {lastCitations.length === 0 ? (
            <div className="mt-6 text-xs text-muted-foreground">Citations from the assistant's latest answer will appear here.</div>
          ) : (
            <div className="mt-3 space-y-2">
              {lastCitations.map((c, idx) => (
                <div key={idx} className="rounded-lg border border-border p-3">
                  <div className="text-xs font-semibold">{c.title}</div>
                  <div className="text-[11px] text-muted-foreground">{c.source}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
