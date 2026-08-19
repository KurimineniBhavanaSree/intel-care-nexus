import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { knowledgeArticles, knowledgeCategories } from "@/lib/mock-data";
import Breadcrumb from "@/components/Breadcrumb";

export const Route = createFileRoute("/dashboard/library")({
  head: () => ({
    meta: [
      { title: "Knowledge Library — MedIntel" },
      { name: "description", content: "Search WHO guidelines, PubMed papers, and curated medical articles used by MedIntel's RAG pipeline." },
      { property: "og:title", content: "Knowledge Library — MedIntel" },
      { property: "og:description", content: "Curated medical knowledge base." },
    ],
  }),
  component: LibraryPage,
});

const PER_PAGE = 6;

function LibraryPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [page, setPage] = useState(1);
  const [bookmarked, setBookmarked] = useState<string[]>(["K-04"]);

  const filtered = useMemo(() => {
    return knowledgeArticles.filter((a) => {
      const okCat = cat === "All" || a.category === cat;
      const okQ = !q || (a.title + a.org + a.tag).toLowerCase().includes(q.toLowerCase());
      return okCat && okQ;
    });
  }, [q, cat]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const toggle = (id: string) =>
    setBookmarked((b) => (b.includes(id) ? b.filter((x) => x !== id) : [...b, id]));

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Dashboard", to: "/dashboard" }, { label: "Knowledge Library" }]} />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Knowledge Library</h1>
        <p className="mt-1 text-sm text-muted-foreground">Trusted sources powering MedIntel's cited answers.</p>
      </div>

      <div className="card-soft p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Search articles, guidelines, papers…"
              className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {knowledgeCategories.map((c) => (
              <button
                key={c}
                onClick={() => { setCat(c); setPage(1); }}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${cat === c ? "bg-primary text-primary-foreground" : "border border-border bg-background hover:bg-muted"}`}
              >{c}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pageItems.map((a) => {
          const isB = bookmarked.includes(a.id);
          return (
            <div key={a.id} className="card-soft flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-[11px] font-bold text-primary">{a.category}</span>
                <button onClick={() => toggle(a.id)} className="text-muted-foreground hover:text-primary" aria-label="Bookmark">
                  {isB ? <BookmarkCheck size={16} className="text-primary" /> : <Bookmark size={16} />}
                </button>
              </div>
              <h3 className="mt-3 text-base font-semibold leading-snug">{a.title}</h3>
              <div className="mt-2 text-xs text-muted-foreground">{a.org} · {a.date}</div>
              <div className="mt-auto pt-3">
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">{a.tag}</span>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="card-soft col-span-full p-10 text-center text-sm text-muted-foreground">
            No articles match your search.
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border disabled:opacity-40"
          ><ChevronLeft size={16} /></button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`h-9 min-w-9 rounded-lg px-3 text-sm font-semibold ${page === i + 1 ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"}`}
            >{i + 1}</button>
          ))}
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border disabled:opacity-40"
          ><ChevronRight size={16} /></button>
        </div>
      )}
    </div>
  );
}
