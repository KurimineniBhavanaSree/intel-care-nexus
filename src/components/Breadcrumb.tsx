import { ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export interface Crumb { label: string; to?: string }

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {items.map((c, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {c.to ? (
            <Link to={c.to} className="hover:text-foreground">{c.label}</Link>
          ) : (
            <span className="text-foreground font-medium">{c.label}</span>
          )}
          {i < items.length - 1 && <ChevronRight size={12} />}
        </span>
      ))}
    </nav>
  );
}
