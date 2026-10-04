import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Topbar } from "@/components/layout/Topbar";
import { PageHeader } from "@/components/ui-kit/PageHeader";
import { Calendar, Pill, Search, Filter, Plus, Pencil, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { activityStore, searchStore, type ActivityLog } from "@/lib/store";

export const Route = createFileRoute("/activity")({
  head: () => ({ meta: [{ title: "Activity Log · RK Health" }] }),
  component: ActivityPage,
});

const toneBg: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/10 text-danger",
  muted: "bg-muted text-muted-foreground",
};

function renderIcon(l: ActivityLog) {
  if (l.kind === "medication") return Pill;
  return Calendar;
}
function renderTone(l: ActivityLog): string {
  if (l.action === "deleted") return "danger";
  if (l.action === "updated") return "warning";
  return l.kind === "medication" ? "success" : "primary";
}
function renderActionIcon(l: ActivityLog) {
  if (l.action === "deleted") return Trash2;
  if (l.action === "updated") return Pencil;
  return Plus;
}
function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function ActivityPage() {
  useEffect(() => { activityStore.hydrate(); }, []);
  const items = activityStore.use();
  const globalQ = searchStore.getQuery();
  const [q, setQ] = useState(globalQ);
  const highlightedId = searchStore.useHighlightedId();

  useEffect(() => {
    if (globalQ) {
      setQ(globalQ);
      searchStore.setQuery("");
    }
  }, [globalQ]);

  useEffect(() => {
    if (highlightedId) {
      const timer = setTimeout(() => {
        searchStore.setHighlightedId(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightedId]);

  const [kind, setKind] = useState<"All" | ActivityLog["kind"]>("All");

  const filtered = useMemo(
    () => items
      .slice()
      .sort((a, b) => b.at.localeCompare(a.at))
      .filter((i) => (kind === "All" || i.kind === kind) && i.title.toLowerCase().includes(q.toLowerCase())),
    [items, q, kind]
  );

  return (
    <AppLayout>
      <Topbar greeting="Activity Log" subtitle="A timeline of everything happening in your account." />

      <PageHeader title="Activity Log" subtitle="View all actions, reminders and system events." />

      <div className="card-surface p-4 mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search activities…" className="w-full h-10 pl-10 pr-3 rounded-xl bg-background border border-border text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <select value={kind} onChange={(e) => setKind(e.target.value as "All" | ActivityLog["kind"])} className="h-10 px-3 rounded-xl bg-background border border-border text-[13.5px]">
            <option value="All">All Activities</option>
            <option value="appointment">Appointments</option>
            <option value="medication">Medications</option>
          </select>
          <button className="h-10 px-3 rounded-xl bg-background border border-border text-[13.5px] inline-flex items-center gap-2"><Filter className="h-4 w-4" /> Filters</button>
        </div>
      </div>

      <div className="card-surface p-6">
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-[13px] text-muted-foreground">No activity yet.</div>
        ) : (
          <ol className="relative pl-4 border-l-2 border-border space-y-5">
            {filtered.map((it) => {
              const Icon = renderIcon(it);
              const ActionIcon = renderActionIcon(it);
              const tone = renderTone(it);
              const isHighlighted = it.id === highlightedId;
              return (
                <li key={it.id} className="relative pl-5">
                  <span className={`absolute -left-[11px] top-1.5 h-5 w-5 rounded-full grid place-items-center ring-4 ring-card ${toneBg[tone]}`}>
                    <Icon className="h-3 w-3" />
                  </span>
                  <div className={`flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-hover transition ${
                    isHighlighted ? "bg-primary/10 border-l-4 border-l-primary" : ""
                  }`}>
                    <div className="min-w-0 flex items-center gap-3">
                      <span className={`h-7 w-7 rounded-lg grid place-items-center ${toneBg[tone]}`}>
                        <ActionIcon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[14px] font-medium truncate">{it.title}</div>
                        <div className="text-[12px] text-muted-foreground">{fmt(it.at)} · {it.action}</div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </AppLayout>
  );
}
