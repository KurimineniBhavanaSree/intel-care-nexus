import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Upload, ImageIcon, Pill, MessageSquare,
  BookOpen, FileText, User, Settings, LogOut, Stethoscope,
} from "lucide-react";
import { toast } from "sonner";

import { authService } from "@/services/authService";

// Reusable sidebar for the authenticated dashboard shell.
const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/upload", label: "Upload Report", icon: Upload },
  { to: "/dashboard/image", label: "Medical Image", icon: ImageIcon },
  { to: "/dashboard/prescription", label: "Prescription", icon: Pill },
  { to: "/dashboard/chat", label: "AI Chat", icon: MessageSquare },
  { to: "/dashboard/library", label: "Knowledge Library", icon: BookOpen },
  { to: "/dashboard/reports", label: "Previous Reports", icon: FileText },
  { to: "/dashboard/profile", label: "Profile", icon: User },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.success("Logged out successfully");
      onNavigate?.();
      navigate({ to: "/login", replace: true });
    } catch {
      toast.error("Logout failed");
      onNavigate?.();
      navigate({ to: "/login", replace: true });
    }
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Stethoscope size={18} />
        </span>
        <span className="text-lg font-bold tracking-tight">MedIntel</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((it) => {
          const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon size={17} />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut size={17} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
