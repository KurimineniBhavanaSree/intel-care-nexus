import { Stethoscope, Github, Twitter, Linkedin, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer id="contact" className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Stethoscope size={18} />
            </span>
            <span className="text-lg font-bold">MedIntel</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Explainable multimodal healthcare AI powered by Retrieval-Augmented Generation.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Quick Links</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><a href="/#features" className="hover:text-foreground">Features</a></li>
            <li><a href="/#technology" className="hover:text-foreground">Technology</a></li>
            <li><a href="/#about" className="hover:text-foreground">About</a></li>
            <li><a href="/login" className="hover:text-foreground">Login</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Contact</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Mail size={14} /> hello@medintel.io</li>
            <li>Bengaluru, India</li>
            <li>+91 80 4567 8900</li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Follow</h4>
          <div className="mt-3 flex gap-2">
            <a href="#" aria-label="Twitter" className="grid h-9 w-9 place-items-center rounded-lg border border-border hover:bg-muted"><Twitter size={16} /></a>
            <a href="#" aria-label="GitHub" className="grid h-9 w-9 place-items-center rounded-lg border border-border hover:bg-muted"><Github size={16} /></a>
            <a href="#" aria-label="LinkedIn" className="grid h-9 w-9 place-items-center rounded-lg border border-border hover:bg-muted"><Linkedin size={16} /></a>
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} MedIntel. All rights reserved.</span>
          <span>For research & educational demonstration. Not a substitute for professional medical advice.</span>
        </div>
      </div>
    </footer>
  );
}
