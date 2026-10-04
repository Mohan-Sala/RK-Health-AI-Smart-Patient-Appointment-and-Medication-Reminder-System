import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Calendar,
  Pill,
  BrainCircuit,
  FileText,
  Activity,
  Settings,
  HeartPulse,
  User,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { authStore } from "@/lib/store";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/appointments", label: "Appointments", icon: Calendar },
  { to: "/medications", label: "Medications", icon: Pill },
  { to: "/ai-summary", label: "AI Summary", icon: BrainCircuit },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/activity", label: "Activity Log", icon: Activity },
] as const;

export function Sidebar() {
  const user = authStore.use();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const go = (to: string) => {
    setOpen(false);
    navigate({ to });
  };

  const isDoctor = user?.role === "doctor";
  const currentNav = isDoctor
    ? [
        { to: "/dashboard", label: "Doctor Overview", icon: LayoutDashboard },
        { to: "/appointments", label: "Patient Schedule", icon: Calendar },
        { to: "/medications", label: "Prescriptions & Dosing", icon: Pill },
        { to: "/ai-summary", label: "AI Consult Summary", icon: BrainCircuit },
        { to: "/reports", label: "Reports & Audits", icon: FileText },
        { to: "/activity", label: "Activity Log", icon: Activity },
      ]
    : nav;

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-[260px] flex-col bg-sidebar border-r border-border z-30">
      {/* Brand */}
      <div className="px-6 pt-5 pb-2">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition select-none">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.55_0.22_295)] grid place-items-center shadow-soft">
            <HeartPulse className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="font-semibold text-[18px] tracking-tight">RK Health</div>
        </Link>
        <div className="mt-2.5">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
            isDoctor ? "bg-ai/10 text-ai border-ai/20" : "bg-primary/10 text-primary border-primary/20"
          }`}>
            <span>{isDoctor ? "👨‍⚕️ Doctor Portal" : "🧑 Patient Portal"}</span>
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {currentNav.map(({ to, label, icon: Icon }) => {
          const active = to === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={[
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] transition-colors duration-200",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground/80 hover:bg-sidebar-hover hover:text-foreground",
              ].join(" ")}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.5 : 2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Profile dropdown */}
      <div ref={wrapperRef} className="relative px-4 pb-5 pt-3 border-t border-border">
        {open && (
          <div className="absolute left-4 right-4 bottom-[78px] origin-bottom animate-scale-in rounded-2xl bg-card border border-border shadow-[0_20px_50px_-15px_rgba(0,0,0,0.3)] overflow-hidden">
            <button onClick={() => go("/profile")} className="w-full flex items-center gap-3 px-4 py-3 text-[14px] hover:bg-hover transition text-left">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Profile</span>
            </button>
            <button onClick={() => go("/settings")} className="w-full flex items-center gap-3 px-4 py-3 text-[14px] hover:bg-hover transition text-left border-t border-border">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span>Settings</span>
            </button>
            <button
              onClick={() => { setOpen(false); setConfirmLogout(true); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-[14px] hover:bg-danger/10 text-danger transition text-left border-t border-border"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        )}

        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-hover transition"
        >
          <img
            src={user?.avatar || "/images/default-avatar.png"}
            alt={user?.name || "User"}
            className="h-9 w-9 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0 text-left">
            <div className="text-[14px] font-medium truncate">{user?.name || "User"}</div>
            <div className="text-[12px] text-muted-foreground truncate">{user?.email || ""}</div>
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={() => {
          authStore.logout();
          toast.success("Logged out successfully");
          setTimeout(() => navigate({ to: "/login" }), 150);
        }}
        title="Logout Confirmation"
        message="Are you sure you want to logout from RK Health?"
        confirmLabel="Logout"
        tone="danger"
      />
    </aside>
  );
}
