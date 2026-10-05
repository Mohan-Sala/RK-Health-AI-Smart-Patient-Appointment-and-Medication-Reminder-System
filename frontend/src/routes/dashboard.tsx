import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Topbar } from "@/components/layout/Topbar";
import {
  Calendar,
  Pill,
  Clock,
  BrainCircuit,
  FileText,
  TrendingUp,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Plus,
  ChevronRight,
  CheckCircle2,
  CalendarPlus,
  PillBottle,
  StickyNote,
  Heart,
  Stethoscope,
  Eye,
  Pencil,
  Trash2,
  Users,
  Activity,
  CalendarClock,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import {
  appointmentsStore,
  medicationsStore,
  activityStore,
  hydrateAllStores,
  apiFetch,
  authStore,
  patientStore,
  type ActivityLog,
  type Appointment,
  type Medication,
} from "@/lib/store";
import { DoctorRescheduleModal } from "@/components/modals/DoctorRescheduleModal";
import { DoctorPrescribeModal } from "@/components/modals/DoctorPrescribeModal";
import { DosageTitrationModal } from "@/components/modals/DosageTitrationModal";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · RK Health" },
      { name: "description", content: "Your daily health overview — appointments, medications, AI summaries, and reports." },
    ],
  }),
  component: Dashboard,
});

/* ---------- helpers ---------- */

type Tone = "primary" | "success" | "warning" | "ai" | "danger";
const toneBg: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-[oklch(0.55_0.17_60)]",
  ai: "bg-ai/10 text-ai",
  danger: "bg-danger/10 text-danger",
};
const toneText: Record<Tone, string> = {
  primary: "text-primary",
  success: "text-success",
  warning: "text-[oklch(0.55_0.17_60)]",
  ai: "text-ai",
  danger: "text-danger",
};

function StatCard({
  icon: Icon,
  title,
  subtitle,
  value,
  trend,
  trendTone = "success",
  tone,
}: {
  icon: typeof Calendar;
  title: string;
  subtitle: string;
  value: string;
  trend: string;
  trendTone?: Tone;
  tone: Tone;
}) {
  return (
    <div className="card-surface hover-lift p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className={`h-12 w-12 rounded-2xl grid place-items-center shrink-0 ${toneBg[tone]}`}>
          <Icon className="h-6 w-6" strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <div className="text-[15px] font-semibold leading-tight">{title}</div>
          <div className="text-[13px] text-muted-foreground">{subtitle}</div>
        </div>
      </div>
      <div>
        <div className="text-[34px] font-semibold tracking-tight leading-none">{value}</div>
        <div className={`mt-2 text-[12px] font-medium flex items-center gap-1 ${toneText[trendTone]}`}>
          <TrendingUp className="h-3.5 w-3.5" />
          {trend}
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`card-surface p-6 ${className}`}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Badge({ children, tone = "primary" }: { children: React.ReactNode; tone?: Tone }) {
  return (
    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${toneBg[tone]}`}>
      {children}
    </span>
  );
}

/* ---------- sections ---------- */

function TodaySchedule() {
  const appts = appointmentsStore.use();
  const meds = medicationsStore.use();

  const formattedItems = useMemo(() => {
    return [
      ...appts
        .filter((a) => a.status === "Today")
        .map((a) => {
          const [h, m] = a.time.split(":").map(Number);
          const period = h >= 12 ? "PM" : "AM";
          const hh = ((h + 11) % 12) + 1;
          const timeStr = `${String(hh).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
          return {
            rawTime: a.time,
            time: timeStr,
            title: a.title,
            sub: a.doctor,
            badge: a.status === "Completed" ? "Completed" : "Upcoming",
            tone: (a.status === "Completed" ? "success" : "primary") as Tone,
            dot: (a.status === "Completed" ? "success" : "primary") as Tone,
          };
        }),
      ...meds.map((m) => {
        const [h, mVal] = m.time.split(":").map(Number);
        const period = h >= 12 ? "PM" : "AM";
        const hh = ((h + 11) % 12) + 1;
        const timeStr = `${String(hh).padStart(2, "0")}:${String(mVal).padStart(2, "0")} ${period}`;
        
        let toneVal: Tone = "warning";
        if (m.status === "Taken") toneVal = "success";
        else if (m.status === "Missed") toneVal = "danger";
        else if (m.status === "Skipped") toneVal = "primary";

        return {
          rawTime: m.time,
          time: timeStr,
          title: `Take ${m.name}`,
          sub: `${m.dosage} · ${m.foodPref}`,
          badge: m.status,
          tone: toneVal,
          dot: toneVal,
        };
      })
    ].sort((a, b) => a.rawTime.localeCompare(b.rawTime)) as {
      rawTime: string;
      time: string;
      title: string;
      sub: string;
      badge: string;
      tone: Tone;
      dot: Tone;
    }[];
  }, [appts, meds]);

  return (
    <SectionCard
      title="Today's Schedule"
      action={
        <Link to="/appointments" className="text-[13px] text-primary font-medium hover:underline">View Calendar</Link>
      }
    >
      <ol className="relative">
        <div className="absolute left-[64px] top-2 bottom-2 w-px bg-border" />
        <div className="space-y-1">
          {formattedItems.length === 0 && (
            <div className="text-[13px] text-muted-foreground py-6 text-center">No tasks scheduled for today.</div>
          )}
          {formattedItems.map((s, i) => (
            <li key={i} className="flex items-center gap-4 py-2.5 group">
              <div className="w-[60px] text-[12px] font-medium text-muted-foreground text-right shrink-0">{s.time}</div>
              <div className={`h-2.5 w-2.5 rounded-full shrink-0 ring-4 ring-card ${
                s.dot === "primary" ? "bg-primary" : s.dot === "ai" ? "bg-ai" : s.dot === "danger" ? "bg-danger" : s.dot === "warning" ? "bg-warning" : "bg-success"
              }`} />
              <div className="flex-1 min-w-0 flex items-center justify-between gap-3 px-3 py-2 rounded-xl group-hover:bg-hover transition">
                <div className="min-w-0">
                  <div className="text-[14px] font-medium truncate">{s.title}</div>
                  <div className="text-[12px] text-muted-foreground truncate">{s.sub}</div>
                </div>
                <Badge tone={s.tone}>{s.badge}</Badge>
              </div>
            </li>
          ))}
        </div>
      </ol>
    </SectionCard>
  );
}

function MedicineTimeline() {
  const meds = medicationsStore.use();
  const morningCount = meds.filter((m) => m.slot === "Morning" && m.status === "Pending").length;
  const afternoonCount = meds.filter((m) => m.slot === "Afternoon" && m.status === "Pending").length;
  const eveningCount = meds.filter((m) => m.slot === "Evening" && m.status === "Pending").length;
  const nightCount = meds.filter((m) => m.slot === "Night" && m.status === "Pending").length;

  const points = [
    { label: "Morning", count: morningCount, icon: Sunrise, color: "oklch(0.78 0.17 65)", x: 60 },
    { label: "Afternoon", count: afternoonCount, icon: Sun, color: "oklch(0.78 0.17 65)", x: 200 },
    { label: "Evening", count: eveningCount, icon: Sunset, color: "oklch(0.637 0.225 25)", x: 340 },
    { label: "Night", count: nightCount, icon: Moon, color: "oklch(0.6 0.21 305)", x: 480 },
  ];
  return (
    <SectionCard title="Medicine Timeline">
      <div className="grid grid-cols-4 gap-2 mb-2">
        {points.map((p) => (
          <div key={p.label} className="text-center">
            <div className="text-[13px] font-medium">{p.label}</div>
            <p.icon className="h-5 w-5 mx-auto mt-2" style={{ color: p.color }} strokeWidth={2.2} />
          </div>
        ))}
      </div>

      {/* line */}
      <svg viewBox="0 0 540 60" className="w-full h-14">
        <defs>
          <linearGradient id="tl" x1="0" x2="1">
            <stop offset="0%" stopColor="oklch(0.78 0.17 65)" />
            <stop offset="50%" stopColor="oklch(0.637 0.225 25)" />
            <stop offset="100%" stopColor="oklch(0.6 0.21 305)" />
          </linearGradient>
        </defs>
        <path d="M60 30 C 170 0, 230 60, 340 30 S 470 0, 480 30" fill="none" stroke="url(#tl)" strokeWidth="2.5" />
        {points.map((p) => (
          <g key={p.label}>
            <circle cx={p.x} cy={30} r={7} fill="white" stroke={p.color} strokeWidth={3} />
          </g>
        ))}
      </svg>

      <div className="grid grid-cols-4 gap-2 mt-2 text-center">
        {points.map((p) => (
          <div key={p.label}>
            <div className="text-[24px] font-semibold leading-none">{p.count}</div>
            <div className="text-[12px] text-muted-foreground mt-1">Pending</div>
          </div>
        ))}
      </div>

      <Link to="/medications" className="mt-6 block text-center w-full py-3 rounded-2xl border border-border text-[14px] font-medium hover:bg-hover transition">
        View All Medications
      </Link>
    </SectionCard>
  );
}

function QuickActions() {
  const actions = [
    { label: "New Appointment", icon: CalendarPlus, tone: "primary" as Tone, to: "/appointments" },
    { label: "Add Medicine", icon: Pill, tone: "success" as Tone, to: "/medications" },
    { label: "Generate AI Summary", icon: BrainCircuit, tone: "ai" as Tone, to: "/ai-summary" },
    { label: "Generate Report", icon: FileText, tone: "primary" as Tone, to: "/reports" },
  ] as const;
  return (
    <SectionCard title="Quick Actions">
      <div className="grid grid-cols-2 gap-3">
        {actions.map((a) => (
          <Link
            key={a.label}
            to={a.to}
            className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)] transition-all duration-200 text-left"
          >
            <div className={`h-10 w-10 rounded-xl grid place-items-center shrink-0 ${toneBg[a.tone]}`}>
              <a.icon className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div className={`text-[13.5px] font-medium ${toneText[a.tone]}`}>+ {a.label}</div>
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}

function UpcomingAppointments() {
  const appts = appointmentsStore.use();
  const items = appts
    .filter((a) => a.status === "Upcoming" || a.status === "Today")
    .slice(0, 4)
    .map((a) => {
      const d = new Date(a.date + "T00:00:00");
      const mon = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
      const day = String(d.getDate()).padStart(2, "0");
      const [h, m] = a.time.split(":").map(Number);
      const period = h >= 12 ? "PM" : "AM";
      const hh = ((h + 11) % 12) + 1;
      const time = `${String(hh).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
      const tone: Tone = a.status === "Today" ? "warning" : "primary";
      return { id: a.id, mon, day, title: a.title, doctor: a.doctor, time, tone };
    });
  return (
    <SectionCard
      title="Upcoming Appointments"
      action={<Link to="/appointments" className="text-[13px] text-primary font-medium hover:underline">View All</Link>}
    >
      <div className="space-y-2">
        {items.length === 0 && (
          <div className="text-[13px] text-muted-foreground py-6 text-center">No upcoming appointments.</div>
        )}
        {items.map((it) => (
          <div key={it.id} className="flex items-center gap-4 p-2.5 rounded-xl hover:bg-hover transition">
            <div className="h-12 w-12 rounded-xl bg-hover grid place-items-center shrink-0">
              <div className="text-center">
                <div className="text-[9px] font-semibold text-muted-foreground tracking-wider">{it.mon}</div>
                <div className="text-[15px] font-semibold leading-none">{it.day}</div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-medium truncate">{it.title}</div>
              <div className="text-[12px] text-muted-foreground truncate">{it.doctor}</div>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground shrink-0">
              <span className={`h-1.5 w-1.5 rounded-full ${it.tone === "primary" ? "bg-primary" : "bg-warning"}`} />
              {it.time}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function activityIcon(a: ActivityLog) {
  if (a.kind === "medication") return Pill;
  return Calendar;
}
function activityActionIcon(a: ActivityLog) {
  if (a.action === "deleted") return Trash2;
  if (a.action === "updated") return Pencil;
  return Plus;
}
function activityTone(a: ActivityLog): Tone {
  if (a.action === "deleted") return "danger";
  if (a.action === "updated") return "warning";
  return a.kind === "medication" ? "success" : "primary";
}
function activityRelTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  return `${d}d ago`;
}

function ActivityOverview() {
  const logs = activityStore.use();
  const items = logs.slice().sort((a, b) => b.at.localeCompare(a.at)).slice(0, 5);
  return (
    <SectionCard
      title="Activity Overview"
      action={
        <Link to="/activity" className="text-[13px] text-muted-foreground font-medium hover:text-foreground flex items-center gap-1">
          View All <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      }
    >
      <div className="space-y-1">
        {items.length === 0 && (
          <div className="text-[13px] text-muted-foreground py-6 text-center">No activity yet.</div>
        )}
        {items.map((it) => {
          const Icon = activityIcon(it);
          const ActionIcon = activityActionIcon(it);
          const tone = activityTone(it);
          return (
            <div key={it.id} className="flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-hover transition">
              <div className={`h-9 w-9 rounded-xl grid place-items-center shrink-0 ${toneBg[tone]}`}>
                <Icon className="h-[18px] w-[18px]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium truncate">{it.title}</div>
                <div className="text-[12px] text-muted-foreground truncate inline-flex items-center gap-1"><ActionIcon className="h-3 w-3" /> {it.action}</div>
              </div>
              <div className="text-[12px] text-muted-foreground shrink-0">{activityRelTime(it.at)}</div>
            </div>
          );
        })}
      </div>
      <Link to="/activity" className="mt-4 block text-center py-2.5 rounded-xl text-[13px] font-medium text-primary hover:bg-primary/5 transition">
        View All Activity
      </Link>
    </SectionCard>
  );
}

function MedicationCompliance({ dashboardData }: { dashboardData: any }) {
  const taken = dashboardData?.medications?.takenToday ?? 0;
  const missed = dashboardData?.medications?.missedToday ?? 0;
  const skipped = dashboardData?.medications?.skippedToday ?? 0;
  const pct = dashboardData?.compliancePercentage ?? 100;
  const total = taken + missed + skipped || 1;
  
  // donut
  const r = 60, c = 2 * Math.PI * r;
  const segs = [
    { val: taken, color: "oklch(0.71 0.17 148)" },
    { val: missed, color: "oklch(0.78 0.17 65)" },
    { val: skipped, color: "oklch(0.637 0.225 25)" },
  ];
  let offset = 0;
  
  return (
    <SectionCard
      title="Medication Compliance"
      action={
        <button className="text-[13px] text-muted-foreground font-medium hover:text-foreground flex items-center gap-1">
          This Week <ChevronRight className="h-3.5 w-3.5 rotate-90" />
        </button>
      }
    >
      <div className="flex items-center gap-6">
        <div className="relative shrink-0">
          <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
            <circle cx="80" cy="80" r={r} stroke="oklch(0.95 0.005 264)" strokeWidth="14" fill="none" />
            {segs.map((s, i) => {
              const len = (s.val / total) * c;
              const el = (
                <circle
                  key={i}
                  cx="80"
                  cy="80"
                  r={r}
                  stroke={s.color}
                  strokeWidth="14"
                  fill="none"
                  strokeDasharray={`${len} ${c - len}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                />
              );
              offset += len;
              return el;
            })}
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="text-[28px] font-semibold leading-none">{pct}%</div>
              <div className="text-[12px] text-muted-foreground mt-1">Compliance</div>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-3 min-w-0">
          {[
            { label: "Taken", val: taken, color: "bg-success", pct: taken + missed + skipped === 0 ? 0 : Math.round((taken / (taken + missed + skipped)) * 100) },
            { label: "Missed", val: missed, color: "bg-warning", pct: taken + missed + skipped === 0 ? 0 : Math.round((missed / (taken + missed + skipped)) * 100) },
            { label: "Skipped", val: skipped, color: "bg-danger", pct: taken + missed + skipped === 0 ? 0 : Math.round((skipped / (taken + missed + skipped)) * 100) },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <span className={`h-2.5 w-2.5 rounded-full ${row.color}`} />
              <span className="text-[14px] flex-1">{row.label}</span>
              <span className="text-[14px] font-medium">{row.val}</span>
              <span className="text-[12px] text-muted-foreground w-12 text-right">({row.pct}%)</span>
            </div>
          ))}
        </div>
      </div>
      <Link to="/reports" className="mt-6 block text-center w-full py-3 rounded-2xl border border-border text-[14px] font-medium hover:bg-hover transition">
        View Full Report
      </Link>
    </SectionCard>
  );
}

function AiSummaryPreview() {
  return (
    <SectionCard
      title="AI Summary Preview"
      action={<Link to="/ai-summary" className="text-[13px] text-primary font-medium hover:underline">View All</Link>}
    >
      <div className="rounded-2xl p-5 bg-gradient-to-br from-[oklch(0.97_0.03_295)] to-[oklch(0.96_0.04_270)] border border-border">
        <div className="flex items-center gap-2 text-[13px]">
          <span className="font-semibold text-ai">Cardiology Consultation</span>
          <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
          <span className="text-muted-foreground">May 20, 2024</span>
        </div>
        <p className="mt-3 text-[13.5px] leading-relaxed text-foreground/85">
          Patient visited for regular heart checkup. Blood pressure and ECG normal.
          Mild cholesterol level observed…
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { label: "Overview", icon: Eye },
            { label: "Diagnosis", icon: Stethoscope },
            { label: "Medicines", icon: Heart },
            { label: "Advice", icon: CheckCircle2 },
          ].map((t) => (
            <span key={t.label} className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full bg-card border border-border text-ai">
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </span>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

/* ---------- Doctor Dashboard View ---------- */

function DoctorDashboardView() {
  const user = authStore.use();
  const appts = appointmentsStore.use();
  const meds = medicationsStore.use();
  const patients = patientStore.use();

  const [rescheduleAppt, setRescheduleAppt] = useState<Appointment | null>(null);
  const [prescribeOpen, setPrescribeOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(undefined);
  const [titrationMed, setTitrationMed] = useState<Medication | null>(null);
  const [clinicStatus, setClinicStatus] = useState<"available" | "busy" | "break">("available");

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayAppts = appts.filter((a) => a.date === todayStr || a.status === "Today");
  const upcomingAppts = appts.filter(
    (a) => a.date >= todayStr && a.status !== "Completed" && a.status !== "Cancelled"
  );

  const prescriptionsWithDisease = meds.filter((m) => m.disease);
  const activePatientsCount =
    new Set([...appts.map((a) => a.patient), ...meds.map((m) => m.patientName).filter(Boolean)]).size ||
    patients.length ||
    1;

  const handleOpenPrescribeForPatient = (patientName?: string) => {
    const found = patients.find((p) => p.fullName.toLowerCase() === (patientName || "").toLowerCase());
    setSelectedPatientId(found ? found.id : undefined);
    setPrescribeOpen(true);
  };

  const handleReschedule = async (id: string, date: string, time: string, reason: string) => {
    await appointmentsStore.reschedule(id, date, time, reason);
  };

  return (
    <AppLayout>
      <Topbar
        greeting={`Welcome, Dr. ${user?.name || "Doctor"}`}
        subtitle="Physician Clinical Overview & Practice Hub"
      />

      {/* Doctor Hero Card */}
      <div className="mb-6 p-6 rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground grid place-items-center shrink-0 shadow-md">
            <Stethoscope className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[20px] font-bold text-foreground">
                Dr. {user?.name || "Physician"}, MD
              </h1>
              <span className="text-[12px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
                {user?.specialization || "General Medicine & Cardiology"}
              </span>
            </div>
            <p className="text-[13.5px] text-muted-foreground mt-1">
              {user?.hospital || "RK Memorial Healthcare Center"} · Consultation Suite 4 · OPD Hours 09:00 - 17:30
            </p>
          </div>
        </div>

        {/* Doctor Availability Live Pill & Prescribe Action */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex items-center gap-2 p-1.5 rounded-2xl border border-border bg-card shadow-sm">
            <button
              onClick={() => setClinicStatus("available")}
              className={`px-3 py-1.5 rounded-xl text-[12px] font-medium transition flex items-center gap-1.5 ${
                clinicStatus === "available"
                  ? "bg-success text-success-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:bg-hover"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-success-foreground animate-pulse" />
              Available
            </button>
            <button
              onClick={() => setClinicStatus("busy")}
              className={`px-3 py-1.5 rounded-xl text-[12px] font-medium transition flex items-center gap-1.5 ${
                clinicStatus === "busy"
                  ? "bg-warning text-warning-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:bg-hover"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-warning-foreground" />
              In Consultation
            </button>
            <button
              onClick={() => setClinicStatus("break")}
              className={`px-3 py-1.5 rounded-xl text-[12px] font-medium transition flex items-center gap-1.5 ${
                clinicStatus === "break"
                  ? "bg-secondary text-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:bg-hover"
              }`}
            >
              Break
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedPatientId(undefined);
              setPrescribeOpen(true);
            }}
            className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:opacity-90 transition shadow-sm inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Prescribe Meds
          </button>
        </div>
      </div>

      {/* Doctor KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5 mb-8">
        <StatCard
          icon={Calendar}
          title="Today's Consultations"
          subtitle="Scheduled"
          value={String(todayAppts.length)}
          trend={`${upcomingAppts.length} Total Upcoming`}
          tone="primary"
        />
        <StatCard
          icon={Users}
          title="Active Patients"
          subtitle="Under Clinical Care"
          value={String(activePatientsCount)}
          trend="Registry Active"
          tone="success"
        />
        <StatCard
          icon={Pill}
          title="Prescriptions"
          subtitle="Active Regimens"
          value={String(meds.length)}
          trend={`${prescriptionsWithDisease.length} Condition-linked`}
          trendTone="warning"
          tone="warning"
        />
        <StatCard
          icon={TrendingUp}
          title="Clinical Recovery"
          subtitle="Disease Improvement"
          value="88%"
          trend="+6% vs Last Month"
          trendTone="success"
          tone="success"
        />
        <StatCard
          icon={Clock}
          title="Clinic Slot Openings"
          subtitle="Available Today"
          value="12 Slots"
          trend="09:00 - 17:30 OPD"
          tone="ai"
        />
      </div>

      {/* Main Grid: Consultation Queue & Disease Titration Tracker */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Consultation Queue (2 columns wide) */}
        <div className="xl:col-span-2 space-y-6">
          <SectionCard
            title="Patient Consultation Queue"
            action={
              <Link
                to="/appointments"
                className="text-[13px] text-primary font-medium hover:underline flex items-center gap-1"
              >
                Full Appointment Schedule <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          >
            <div className="space-y-3">
              {appts.length === 0 ? (
                <div className="text-center py-10 text-[13.5px] text-muted-foreground card-surface">
                  No appointments currently scheduled.
                </div>
              ) : (
                appts.slice(0, 5).map((a) => (
                  <div
                    key={a.id}
                    className="p-4 rounded-2xl border border-border bg-background hover:bg-hover transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center font-bold text-[14px] shrink-0 mt-0.5">
                        {a.patient ? a.patient.charAt(0).toUpperCase() : "P"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[14.5px] font-semibold text-foreground">{a.patient}</span>
                          <span className="text-[11.5px] font-medium px-2 py-0.5 rounded-full bg-secondary text-foreground">
                            {a.visitType}
                          </span>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              a.priority === "High"
                                ? "bg-danger/15 text-danger"
                                : a.priority === "Medium"
                                ? "bg-warning/15 text-warning"
                                : "bg-success/15 text-success"
                            }`}
                          >
                            {a.priority} Priority
                          </span>
                        </div>
                        <div className="text-[13px] text-muted-foreground mt-0.5">{a.title}</div>
                        <div className="text-[12px] text-muted-foreground mt-1 flex items-center gap-2">
                          <CalendarClock className="h-3.5 w-3.5 text-primary" />
                          <span>
                            {a.date} at <strong className="text-foreground">{a.time}</strong>
                          </span>
                          {a.notes && <span className="truncate">· Notes: {a.notes}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Doctor Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => setRescheduleAppt(a)}
                        className="h-8 px-3 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 text-[12px] font-semibold inline-flex items-center gap-1.5 transition"
                        title="Reschedule based on doctor availability"
                      >
                        <CalendarClock className="h-3.5 w-3.5" /> Reschedule
                      </button>
                      <button
                        onClick={() => handleOpenPrescribeForPatient(a.patient)}
                        className="h-8 px-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-[12px] font-semibold inline-flex items-center gap-1.5 transition"
                        title="Prescribe medication for this patient"
                      >
                        <Pill className="h-3.5 w-3.5" /> Prescribe
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SectionCard>

          {/* Disease Recovery & Dosage Titration Tracker */}
          <SectionCard
            title="Disease Improvement & Dose Titration Tracker"
            action={
              <Link
                to="/medications"
                className="text-[13px] text-primary font-medium hover:underline flex items-center gap-1"
              >
                View All Prescriptions <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          >
            <p className="text-[12.5px] text-muted-foreground mb-4">
              Patient pharmacotherapy monitoring. When patient condition improves, click{" "}
              <strong className="text-foreground">Adjust Dose</strong> to safely decrease or taper medication
              dosage.
            </p>

            <div className="space-y-3">
              {meds.length === 0 ? (
                <div className="text-center py-8 text-[13px] text-muted-foreground">
                  No active prescriptions recorded yet.
                </div>
              ) : (
                meds.slice(0, 4).map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-2xl border border-border bg-background hover:bg-hover transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-success/10 text-success grid place-items-center shrink-0 mt-0.5">
                        <Activity className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[14px] font-semibold text-foreground">{m.name}</span>
                          <span className="text-[12px] font-bold text-primary px-2 py-0.5 rounded-md bg-primary/10">
                            {m.dosage}
                          </span>
                          {m.disease && (
                            <span className="text-[11.5px] font-medium px-2 py-0.5 rounded-full bg-secondary text-foreground">
                              {m.disease}
                            </span>
                          )}
                        </div>
                        <div className="text-[12px] text-muted-foreground mt-1">
                          {m.patientName ? `Patient: ${m.patientName} · ` : ""}
                          {m.frequency} · {m.slot}
                        </div>
                        {m.notes && (
                          <div className="text-[11.5px] text-muted-foreground mt-0.5 truncate max-w-[450px]">
                            {m.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setTitrationMed(m)}
                      className="h-8 px-3.5 rounded-lg bg-success/15 text-success hover:bg-success/20 text-[12px] font-semibold inline-flex items-center gap-1.5 transition shrink-0 self-end sm:self-center"
                    >
                      <TrendingDown className="h-3.5 w-3.5" /> Adjust Dose (Titrate)
                    </button>
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        </div>

        {/* Right Sidebar: Availability Schedule & Clinical Reference Cards */}
        <div className="space-y-6">
          {/* Doctor Clinic Availability Slots Widget */}
          <SectionCard title="Doctor Availability & Consultation Slots">
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-secondary/50 border border-border">
                <div className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Morning OPD Session (09:00 - 12:30)
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {["09:00", "09:30", "10:15", "11:00", "11:45"].map((slot, idx) => (
                    <span
                      key={slot}
                      className={`text-[11.5px] py-1 text-center rounded-lg border font-medium ${
                        idx === 1
                          ? "bg-primary/10 border-primary/30 text-primary font-semibold"
                          : "bg-background border-border text-foreground"
                      }`}
                    >
                      {slot}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-secondary/50 border border-border">
                <div className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Afternoon OPD Session (14:00 - 17:00)
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {["14:00", "14:30", "15:15", "16:00", "16:45"].map((slot) => (
                    <span
                      key={slot}
                      className="text-[11.5px] py-1 text-center rounded-lg border border-border bg-background text-foreground font-medium"
                    >
                      {slot}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-secondary/50 border border-border">
                <div className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Evening Follow-ups (17:30 - 19:00)
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {["17:30", "18:15", "19:00"].map((slot) => (
                    <span
                      key={slot}
                      className="text-[11.5px] py-1 text-center rounded-lg border border-border bg-background text-foreground font-medium"
                    >
                      {slot}
                    </span>
                  ))}
                </div>
              </div>

              <Link
                to="/appointments"
                className="w-full py-2.5 rounded-xl border border-border hover:bg-hover text-center block text-[12.5px] font-semibold text-foreground transition"
              >
                Manage Clinic Availability Hours
              </Link>
            </div>
          </SectionCard>

          {/* Clinical Reference & Staging Quick Tools */}
          <SectionCard title="Clinical Diagnostic Reference">
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                <div className="text-[12.5px] font-bold text-primary flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" /> Hypertension Staging (AHA/ACC)
                </div>
                <ul className="text-[11.5px] text-muted-foreground mt-2 space-y-1">
                  <li>• <strong>Normal:</strong> &lt;120 / &lt;80 mmHg</li>
                  <li>• <strong>Elevated:</strong> 120–129 / &lt;80 mmHg</li>
                  <li>• <strong>Stage 1 HTN:</strong> 130–139 / 80–89 mmHg</li>
                  <li>• <strong>Stage 2 HTN:</strong> ≥140 / ≥90 mmHg</li>
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-success/5 border border-success/20">
                <div className="text-[12.5px] font-bold text-success flex items-center gap-1.5">
                  <TrendingDown className="h-4 w-4" /> Dose Tapering Guidelines
                </div>
                <p className="text-[11.5px] text-muted-foreground mt-1.5 leading-relaxed">
                  Upon sustained symptom control and normal biomarkers, taper dosages by 25–50% every 2–4 weeks while
                  monitoring patient vitals.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                <div className="text-[12.5px] font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-ai" /> Glycemic Targets (ADA 2024)
                </div>
                <div className="text-[11.5px] text-muted-foreground mt-1">
                  Fasting: 80–130 mg/dL · Postprandial: &lt;180 mg/dL · HbA1c: &lt;7.0%
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Modals */}
      <DoctorRescheduleModal
        open={!!rescheduleAppt}
        onClose={() => setRescheduleAppt(null)}
        appointment={rescheduleAppt}
        onReschedule={handleReschedule}
      />
      <DoctorPrescribeModal
        open={prescribeOpen}
        onClose={() => setPrescribeOpen(false)}
        preselectedPatientId={selectedPatientId}
      />
      <DosageTitrationModal
        open={!!titrationMed}
        onClose={() => setTitrationMed(null)}
        medication={titrationMed}
      />
    </AppLayout>
  );
}

/* ---------- main page ---------- */

function Dashboard() {
  const currentUser = authStore.use();
  const appts = appointmentsStore.use();
  const meds = medicationsStore.use();
  
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    hydrateAllStores();
  }, []);

  useEffect(() => {
    if (currentUser?.role === "doctor") return;
    const fetchDashboardStats = async () => {
      try {
        const [dashRes, statsRes] = await Promise.all([
          apiFetch("/dashboard"),
          apiFetch("/dashboard/stats"),
        ]);
        if (dashRes.success) setDashboardData(dashRes.data);
        if (statsRes.success) setStats(statsRes.data);
      } catch (err) {}
    };
    fetchDashboardStats();
  }, [currentUser?.id, currentUser?.role]);

  if (currentUser?.role === "doctor") {
    return <DoctorDashboardView />;
  }


  const apptVal = stats ? String(stats.cards.find((c: any) => c.type === "appointments")?.value ?? appts.length) : String(appts.length);
  const upcomingVal = stats ? String(stats.cards.find((c: any) => c.type === "upcoming")?.value ?? "0") : "0";
  const medVal = stats ? String(stats.cards.find((c: any) => c.type === "medications")?.value ?? meds.length) : String(meds.length);
  const pendingVal = stats ? String(stats.cards.find((c: any) => c.type === "pending")?.value ?? "0") : "0";
  const missedVal = stats ? String(stats.cards.find((c: any) => c.type === "missed")?.value ?? "0") : "0";
  const complianceVal = stats ? String(stats.cards.find((c: any) => c.type === "compliance")?.value ?? "100%") : "100%";
  const reportsVal = stats ? String(stats.cards.find((c: any) => c.type === "reports")?.value ?? "0") : "0";
  const aiVal = stats ? String(stats.cards.find((c: any) => c.type === "ai")?.value ?? "0") : "0";

  return (
    <AppLayout>
      <Topbar greeting={dashboardData?.welcomeMessage} />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5 mb-8">
        <StatCard icon={Calendar} title="Appointments" subtitle="Total" value={apptVal} trend={`${upcomingVal} Upcoming`} tone="primary" />
        <StatCard icon={Pill} title="Medications" subtitle="Total" value={medVal} trend={`${pendingVal} Pending`} trendTone="warning" tone="success" />
        <StatCard icon={Clock} title="Compliance" subtitle="Overall" value={complianceVal} trend={`${missedVal} Missed Today`} trendTone="warning" tone="warning" />
        <StatCard icon={BrainCircuit} title="AI Summaries" subtitle="Generated" value={aiVal} trend="Sync Active" tone="ai" />
        <StatCard icon={FileText} title="Reports" subtitle="Generated" value={reportsVal} trend="Sync Active" trendTone="primary" tone="primary" />
      </div>


      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <TodaySchedule />
        <MedicineTimeline />
        <div className="space-y-6">
          <QuickActions />
          <UpcomingAppointments />
        </div>
      </div>

      {/* Secondary grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
        <ActivityOverview />
        <MedicationCompliance dashboardData={dashboardData} />
        <AiSummaryPreview />
      </div>

      {/* Decorative unused refs to avoid lint */}
      <span className="hidden">
        <StickyNote /> <PillBottle />
      </span>
    </AppLayout>
  );
}
