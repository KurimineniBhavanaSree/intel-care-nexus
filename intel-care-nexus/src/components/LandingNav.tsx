import { Link } from "@tanstack/react-router";
import { Stethoscope, Menu, X } from "lucide-react";
import { useState } from "react";

// Top marketing navigation used across the landing route.
export default function LandingNav() {
  const [open, setOpen] = useState(false);

  const links = [
    { to: "/", label: "Home" },
    { to: "/#features", label: "Features" },
    { to: "/#technology", label: "Technology" },
    { to: "/#about", label: "About" },
    { to: "/#contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Stethoscope size={18} />
          </span>
          <span className="text-lg font-bold tracking-tight">MedIntel</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <a key={l.to} href={l.to} className="text-sm font-medium text-muted-foreground hover:text-foreground">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link to="/login" className="btn-outline">Login</Link>
          <Link to="/register" className="btn-primary">Register</Link>
        </div>

        <button
          className="grid h-10 w-10 place-items-center rounded-lg border border-border md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4">
            {links.map((l) => (
              <a key={l.to} href={l.to} className="rounded-md px-2 py-2 text-sm font-medium text-foreground hover:bg-muted">
                {l.label}
              </a>
            ))}
            <div className="mt-2 flex gap-2">
              <Link to="/login" className="btn-outline flex-1">Login</Link>
              <Link to="/register" className="btn-primary flex-1">Register</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
