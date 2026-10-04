import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Pill,
  CalendarCheck2,
  BrainCircuit,
  FileDown,
  Clock,
  AlertTriangle,
  CheckCheck,
} from "lucide-react";
import { notificationStore, Notification } from "@/lib/store";

type Tone = "primary" | "success" | "warning" | "ai" | "danger";

const toneBg: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning",
  ai: "bg-ai/10 text-ai",
  danger: "bg-danger/10 text-danger",
};

function getNotificationMeta(n: Notification): { icon: any; tone: Tone } {
  const type = (n.type || "").toLowerCase();
  const title = (n.title || "").toLowerCase();

  if (type.includes("medication") || title.includes("medication") || title.includes("medicine")) {
    if (title.includes("missed") || title.includes("failed")) {
      return { icon: AlertTriangle, tone: "danger" };
    }
    return { icon: Pill, tone: "ai" };
  }

  if (type.includes("appointment") || title.includes("appointment")) {
    if (title.includes("upcoming") || title.includes("tomorrow")) {
      return { icon: Clock, tone: "warning" };
    }
    return { icon: CalendarCheck2, tone: "primary" };
  }

  if (type.includes("ai") || title.includes("ai")) {
    return { icon: BrainCircuit, tone: "ai" };
  }

  if (type.includes("report") || title.includes("report")) {
    return { icon: FileDown, tone: "success" };
  }

  return { icon: Bell, tone: "primary" };
}

function formatRelativeTime(dateString: string): string {
  if (!dateString) return "";
  const now = new Date();
  const date = new Date(dateString);
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 45) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const notifications = notificationStore.use();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationStore.markAllAsRead();
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.isRead) {
      await notificationStore.markAsRead(n.id);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative h-10 w-10 grid place-items-center rounded-full hover:bg-hover transition"
        aria-label="Notifications"
      >
        <Bell className="h-[18px] w-[18px] text-foreground/80" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-danger text-white text-[10px] font-semibold grid place-items-center animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[380px] max-w-[92vw] origin-top-right rounded-2xl bg-popover border border-border shadow-[var(--shadow-hover)] z-50 animate-scale-in overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card/50">
            <div className="flex items-center gap-2">
              <div className="text-[15px] font-semibold">Notifications</div>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-primary/10 text-primary">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[12px] font-medium text-primary hover:underline flex items-center gap-1"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all as read
              </button>
            )}
          </div>

          {/* List or Empty State */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border/40">
            {notifications.length === 0 ? (
              <div className="py-12 px-6 text-center">
                <div className="h-11 w-11 mx-auto rounded-full bg-muted/60 grid place-items-center mb-3 text-muted-foreground">
                  <Bell className="h-5 w-5" />
                </div>
                <div className="text-[13.5px] font-semibold text-foreground">No notifications yet</div>
                <div className="text-[12px] text-muted-foreground mt-1 max-w-[240px] mx-auto leading-relaxed">
                  Your medication reminders and appointment alerts will show up dynamically here.
                </div>
              </div>
            ) : (
              notifications.map((n) => {
                const meta = getNotificationMeta(n);
                const Icon = meta.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-left flex items-start gap-3.5 px-4.5 py-3.5 hover:bg-hover transition ${
                      !n.isRead ? "bg-primary/[0.03]" : ""
                    }`}
                  >
                    <div className={`h-9 w-9 rounded-xl grid place-items-center shrink-0 ${toneBg[meta.tone]}`}>
                      <Icon className="h-[18px] w-[18px]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className={`text-[13px] truncate ${!n.isRead ? "font-semibold text-foreground" : "font-medium text-foreground/80"}`}>
                          {n.title}
                        </div>
                        {!n.isRead && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0 ring-4 ring-primary/10" />
                        )}
                      </div>
                      <div className="text-[12px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                        {n.message}
                      </div>
                    </div>
                    <div className="text-[11px] text-muted-foreground/75 shrink-0 pt-0.5 whitespace-nowrap">
                      {formatRelativeTime(n.createdAt)}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-border bg-card/30 text-center">
            <button
              onClick={() => {
                setOpen(false);
                navigate({ to: "/activity" });
              }}
              className="text-[12.5px] font-medium text-primary hover:underline"
            >
              View Activity Log
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
