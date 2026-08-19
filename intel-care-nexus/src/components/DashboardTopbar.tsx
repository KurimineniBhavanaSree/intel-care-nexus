import { Bell, Search, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { notifications } from "@/lib/mock-data";
import { authService, type User } from "@/services/authService";

interface Props {
  onOpenSidebar: () => void;
}

export default function DashboardTopbar({ onOpenSidebar }: Props) {
  const [showNotif, setShowNotif] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const unread = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      try {
        const data = await authService.getCurrentUser();
        if (active) {
          setUser(data);
        }
      } catch {
        if (active) {
          setUser(null);
        }
      }
    };

    loadUser();

    return () => {
      active = false;
    };
  }, []);

  const initials = (user?.name ?? "User")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6">
      <button
        onClick={onOpenSidebar}
        className="grid h-10 w-10 place-items-center rounded-lg border border-border lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu size={18} />
      </button>

      <div className="relative flex-1 max-w-lg">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search reports, patients, medicines…"
          className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setShowNotif((v) => !v)}
            className="relative grid h-10 w-10 place-items-center rounded-lg border border-border hover:bg-muted"
            aria-label="Notifications"
          >
            <Bell size={17} />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {unread}
              </span>
            )}
          </button>
          {showNotif && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-popover p-2 shadow-elevated">
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Notifications
              </div>
              {notifications.map((n) => (
                <div key={n.id} className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-muted">
                  <span className={`mt-1.5 h-2 w-2 rounded-full ${n.unread ? "bg-primary" : "bg-border"}`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{n.title}</div>
                    <div className="text-xs text-muted-foreground">{n.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-2 py-1.5">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} className="h-7 w-7 rounded-full object-cover" />
          ) : (
            <div className="grid h-7 w-7 place-items-center rounded-full bg-primary-soft text-[11px] font-bold text-primary">
              {initials}
            </div>
          )}
          <div className="hidden text-right sm:block">
            <div className="text-xs font-semibold leading-tight">{user?.name ?? "Loading..."}</div>
            <div className="text-[11px] text-muted-foreground leading-tight">{user?.role ?? "Authenticated user"}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
