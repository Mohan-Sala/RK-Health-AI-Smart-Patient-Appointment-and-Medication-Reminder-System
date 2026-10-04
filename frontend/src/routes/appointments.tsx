import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Topbar } from "@/components/layout/Topbar";
import { PageHeader, StatusBadge, toneBg } from "@/components/ui-kit/PageHeader";
import {
  Plus, Search, Calendar, CalendarDays, LayoutGrid, List, Eye, Pencil, Trash2,
  BrainCircuit, CalendarClock, MessageSquare, ExternalLink,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { appointmentsStore, logActivity, searchStore, authStore, getGoogleCalendarUrl, type Appointment } from "@/lib/store";
import { AppointmentModal } from "@/components/modals/AppointmentModal";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { DoctorRescheduleModal } from "@/components/modals/DoctorRescheduleModal";

export const Route = createFileRoute("/appointments")({
  head: () => ({ meta: [{ title: "Appointments · RK Health" }] }),
  component: AppointmentsPage,
});

const statusTone: Record<Appointment["status"], "primary" | "success" | "warning" | "danger"> = {
  Upcoming: "primary", Today: "warning", Completed: "success", Cancelled: "danger",
};

function formatDate(d: string) {
  if (!d) return "";
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}
function formatTime(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hh = ((h + 11) % 12) + 1;
  return `${String(hh).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

function AppointmentsPage() {
  useEffect(() => { appointmentsStore.hydrate(); }, []);
  const rows = appointmentsStore.use();

  const [view, setView] = useState<"table" | "calendar">("table");
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
  const [filter, setFilter] = useState<Appointment["status"] | "All">("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [deleting, setDeleting] = useState<Appointment | null>(null);
  const [rescheduling, setRescheduling] = useState<Appointment | null>(null);
  const [sendingSmsId, setSendingSmsId] = useState<string | null>(null);
  const user = authStore.use();
  const isDoctor = user?.role === "doctor";

  const handleSendSms = async (appt: Appointment) => {
    const targetPhone = appt.phone || user?.phone;
    if (!targetPhone) {
      toast.error("Please configure a mobile number in Settings to send SMS reminders.");
      return;
    }
    setSendingSmsId(appt.id);
    try {
      const res = await appointmentsStore.sendSms(appt.id, targetPhone);
      const dispatchedTo = res?.data?.phone || targetPhone;
      toast.success(`Twilio SMS appointment reminder sent to ${dispatchedTo}!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to dispatch SMS reminder");
    } finally {
      setSendingSmsId(null);
    }
  };

  const data = useMemo(
    () => rows.filter(
      (r) => (filter === "All" || r.status === filter) &&
        (q === "" ||
          r.title.toLowerCase().includes(q.toLowerCase()) ||
          r.doctor.toLowerCase().includes(q.toLowerCase()) ||
          r.patient.toLowerCase().includes(q.toLowerCase()))
    ),
    [rows, filter, q]
  );

  const stats = {
    total: rows.length,
    today: rows.filter((r) => r.status === "Today").length,
    upcoming: rows.filter((r) => r.status === "Upcoming").length,
    completed: rows.filter((r) => r.status === "Completed").length,
    cancelled: rows.filter((r) => r.status === "Cancelled").length,
  };

  const openNew = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (r: Appointment) => { setEditing(r); setModalOpen(true); };

  const handleSave = async (data: Omit<Appointment, "id" | "status"> & { status?: Appointment["status"] }) => {
    const today = new Date().toISOString().slice(0, 10);
    const status: Appointment["status"] = data.status ?? (data.date === today ? "Today" : data.date < today ? "Completed" : "Upcoming");
    const full = { ...data, status };
    try {
      if (editing) {
        await appointmentsStore.update(editing.id, full);
        toast.success("Appointment updated successfully");
      } else {
        await appointmentsStore.add(full);
        toast.success("Appointment added successfully");
      }
      setModalOpen(false);
      setEditing(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to save appointment");
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await appointmentsStore.remove(deleting.id);
      toast.success("Appointment deleted successfully");
      setDeleting(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete appointment");
    }
  };

  return (
    <AppLayout>
      <Topbar greeting="Appointments" subtitle="Manage upcoming consultations and history." />

      <PageHeader
        title="Appointments"
        subtitle="View, schedule, and manage doctor appointments."
        actions={
          <button onClick={openNew} className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-[13.5px] font-medium hover:opacity-90 transition">
            <Plus className="h-4 w-4" /> New Appointment
          </button>
        }
      />

      {isDoctor && (
        <div className="card-surface p-4 mb-6 border-l-4 border-l-primary flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[14px] font-semibold text-foreground">Doctor Consultation & Availability Manager</div>
              <div className="text-[12.5px] text-muted-foreground">Manage upcoming patient visits and reschedule consultation slots based on your availability. An instant alert will be sent to the patient.</div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-success/10 text-success border border-success/20 shrink-0">
            ● Clinic Active: 09:00 AM - 05:00 PM
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: "Total", val: stats.total, tone: "primary" as const },
          { label: "Today", val: stats.today, tone: "warning" as const },
          { label: "Upcoming", val: stats.upcoming, tone: "primary" as const },
          { label: "Completed", val: stats.completed, tone: "success" as const },
          { label: "Cancelled", val: stats.cancelled, tone: "danger" as const },
        ].map((s) => (
          <div key={s.label} className="card-surface p-5">
            <div className="text-[12.5px] text-muted-foreground">{s.label}</div>
            <div className="mt-1 text-[28px] font-semibold tracking-tight">{s.val}</div>
            <div className={`mt-2 h-1.5 w-10 rounded-full ${toneBg[s.tone].split(" ")[0]}`} />
          </div>
        ))}
      </div>

      <div className="card-surface p-4 mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search appointments…" className="w-full h-10 pl-10 pr-3 rounded-xl bg-background border border-border text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value as Appointment["status"] | "All")} className="h-10 px-3 rounded-xl bg-background border border-border text-[13.5px]">
            <option value="All">All Status</option>
            <option>Today</option><option>Upcoming</option><option>Completed</option><option>Cancelled</option>
          </select>
          <button className="h-10 px-3 rounded-xl bg-background border border-border text-[13.5px] inline-flex items-center gap-2">
            <Calendar className="h-4 w-4" /> May 2025
          </button>
          <div className="ml-auto inline-flex rounded-xl border border-border bg-background p-1">
            <button onClick={() => setView("table")} className={`h-8 px-3 rounded-lg text-[12.5px] inline-flex items-center gap-1.5 ${view==="table" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}><List className="h-3.5 w-3.5" />Table</button>
            <button onClick={() => setView("calendar")} className={`h-8 px-3 rounded-lg text-[12.5px] inline-flex items-center gap-1.5 ${view==="calendar" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}><LayoutGrid className="h-3.5 w-3.5" />Calendar</button>
          </div>
        </div>
      </div>

      {view === "table" ? (
        <div className="card-surface overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-3 px-6 py-3 text-[12px] uppercase tracking-wider text-muted-foreground border-b border-border bg-secondary/50">
            <div className="col-span-3">Doctor</div>
            <div className="col-span-3">Title</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-1">Time</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          {data.length === 0 && (
            <div className="px-6 py-10 text-center text-[13px] text-muted-foreground">No appointments found.</div>
          )}
          {data.map((r) => {
            const isHighlighted = r.id === highlightedId;
            return (
              <div
                key={r.id}
                className={`grid grid-cols-1 md:grid-cols-12 gap-3 px-6 py-4 border-b border-border last:border-0 hover:bg-hover transition items-center ${
                  isHighlighted ? "bg-primary/10 border-l-4 border-l-primary" : ""
                }`}
              >
                <div className="md:col-span-3">
                  <div className="text-[14px] font-medium">{r.doctor}</div>
                  <div className="text-[12px] text-muted-foreground">{r.spec}</div>
                </div>
                <div className="md:col-span-3 text-[13.5px]">{r.title}</div>
                <div className="md:col-span-2 text-[13px] text-muted-foreground">{formatDate(r.date)}</div>
                <div className="md:col-span-1 text-[13px] text-muted-foreground">{formatTime(r.time)}</div>
                <div className="md:col-span-1"><StatusBadge tone={statusTone[r.status]}>{r.status}</StatusBadge></div>
                <div className="md:col-span-2 flex items-center justify-end gap-1.5 flex-wrap">
                  <a
                    href={getGoogleCalendarUrl(r)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 w-8 grid place-items-center rounded-lg hover:bg-primary/10 text-primary transition"
                    title="Add to Google Calendar"
                  >
                    <Calendar className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => handleSendSms(r)}
                    disabled={sendingSmsId === r.id}
                    className="h-8 w-8 grid place-items-center rounded-lg hover:bg-primary/10 text-primary transition disabled:opacity-50"
                    title="Send Twilio SMS Text Reminder"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setRescheduling(r)}
                    className="h-8 px-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[11.5px] font-medium inline-flex items-center gap-1 transition"
                    title="Reschedule Appointment"
                  >
                    <CalendarClock className="h-3.5 w-3.5" />
                    <span>Reschedule</span>
                  </button>
                  <button onClick={() => openEdit(r)} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-secondary text-muted-foreground" title="Edit"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setDeleting(r)} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-danger/10 text-danger" title="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-semibold">May 2025</h3>
            <div className="flex items-center gap-2 text-muted-foreground text-[13px]"><CalendarDays className="h-4 w-4" />Month View</div>
          </div>
          <div className="grid grid-cols-7 gap-2 text-[11px] text-muted-foreground mb-2">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => <div key={d} className="text-center font-medium">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => {
              const day = i - 3;
              const has = rows.some((r) => r.date.endsWith(`-${String(day).padStart(2, "0")}`));
              const today = day === 24;
              return (
                <div key={i} className={`aspect-square rounded-xl border p-2 text-[12px] flex flex-col ${today ? "bg-primary/10 border-primary/30" : "border-border bg-background"}`}>
                  <span className={`${day < 1 || day > 31 ? "text-muted-foreground/40" : "font-medium"}`}>{day > 0 && day <= 31 ? day : ""}</span>
                  {has && <div className="mt-auto"><span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" /></div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AppointmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing}
        onSave={handleSave}
      />
      <DoctorRescheduleModal
        open={!!rescheduling}
        onClose={() => setRescheduling(null)}
        appointment={rescheduling}
        onReschedule={async (id, date, time, reason) => {
          await appointmentsStore.reschedule(id, date, time, reason);
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Appointment"
        message={`Delete this appointment${deleting ? ` with ${deleting.doctor}` : ""}? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </AppLayout>
  );
}
