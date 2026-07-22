import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import { Send, Trash2, Sparkles, BookOpen, Bot, User } from "lucide-react";
import { chatSeed, suggestedQuestions, type ChatMessage } from "@/lib/mock-data";
import Breadcrumb from "@/components/Breadcrumb";

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
  const [messages, setMessages] = useState<ChatMessage[]>(chatSeed);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content:
            "Based on your recent lab results and the ACC/AHA cholesterol guideline, I'd recommend a Mediterranean-style diet, 150 minutes/week of moderate aerobic activity, and a follow-up lipid panel in 8–12 weeks. If LDL remains ≥130 mg/dL, discuss statin therapy with your physician.",
          citations: [
            { title: "ACC/AHA 2018 Cholesterol Guideline", source: "acc.org" },
            { title: "WHO Physical Activity Guidelines", source: "who.int" },
          ],
        },
      ]);
      setTyping(false);
    }, 1200);
  };

  const clear = () => setMessages([chatSeed[0]]);
  const lastCitations = [...messages].reverse().find((m) => m.role === "assistant" && m.citations)?.citations || [];

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

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${m.role === "user" ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"}`}>
                  {m.role === "user" ? <User size={14} /> : <Bot size={14} />}
                </span>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <div>{m.content}</div>
                  {m.citations && m.citations.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {m.citations.map((c) => (
                        <span key={c.title} className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-semibold text-foreground">
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

            <div ref={bottomRef} />
          </div>

          <div className="border-t border-border p-3">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {suggestedQuestions.map((q) => (
                <button key={q} onClick={() => send(q)} className="rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium hover:border-primary hover:bg-primary-soft">
                  {q}
                </button>
              ))}
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
              {lastCitations.map((c) => (
                <div key={c.title} className="rounded-lg border border-border p-3">
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
