import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Topbar } from "@/components/layout/Topbar";
import { PageHeader, StatusBadge } from "@/components/ui-kit/PageHeader";
import { Plus, Search, Pill, Pencil, Trash2, Check, Sunrise, Sun, Sunset, Moon, Stethoscope, TrendingDown, UserCheck, Activity, MessageSquare } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { medicationsStore, logActivity, searchStore, authStore, patientStore, type Medication } from "@/lib/store";
import { MedicationModal } from "@/components/modals/MedicationModal";
import { DoctorPrescribeModal } from "@/components/modals/DoctorPrescribeModal";
import { DosageTitrationModal } from "@/components/modals/DosageTitrationModal";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";

export const Route = createFileRoute("/medications")({
  head: () => ({ meta: [{ title: "Medications · RK Health" }] }),
  component: MedicationsPage,
});

const tone: Record<Medication["status"], "warning" | "success" | "muted" | "danger"> = {
  Pending: "warning", Taken: "success", Skipped: "muted", Missed: "danger",
};

const slots = [
  { label: "Morning", icon: Sunrise, color: "text-warning" },
  { label: "Afternoon", icon: Sun, color: "text-warning" },
  { label: "Evening", icon: Sunset, color: "text-danger" },
  { label: "Night", icon: Moon, color: "text-ai" },
] as const;

function formatTime(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hh = ((h + 11) % 12) + 1;
  return `${String(hh).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

function MedicationsPage() {
  useEffect(() => {
    medicationsStore.hydrate();
    patientStore.hydrate();
  }, []);

  const meds = medicationsStore.use();
  const currentUser = authStore.use();
  const isDoctor = currentUser?.role === "doctor";

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

  const [slot, setSlot] = useState<string>("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [prescribeOpen, setPrescribeOpen] = useState(false);
  const [titrationMed, setTitrationMed] = useState<Medication | null>(null);
  const [editing, setEditing] = useState<Medication | null>(null);
  const [deleting, setDeleting] = useState<Medication | null>(null);
  const [sendingSmsId, setSendingSmsId] = useState<string | null>(null);

  const handleSendSms = async (m: Medication) => {
    const targetPhone = m.phone || currentUser?.phone;
    if (!targetPhone) {
      toast.error("Please configure a mobile number in Settings to send SMS alerts.");
      return;
    }
    setSendingSmsId(m.id);
    try {
      const res = await medicationsStore.sendSms(m.id);
      const dispatchedTo = res?.data?.phone || targetPhone;
      toast.success(`Twilio SMS reminder sent to ${dispatchedTo}!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to dispatch SMS reminder");
    } finally {
      setSendingSmsId(null);
    }
  };

  const list = useMemo(
    () =>
      meds.filter((m) => {
        const matchSlot = slot === "All" || m.slot === slot;
        if (!matchSlot) return false;
        if (!q) return true;
        const query = q.toLowerCase();
        return (
          m.name.toLowerCase().includes(query) ||
          (m.disease && m.disease.toLowerCase().includes(query)) ||
          (m.patientName && m.patientName.toLowerCase().includes(query)) ||
          (m.prescribedBy && m.prescribedBy.toLowerCase().includes(query))
        );
      }),
    [meds, slot, q]
  );

  const taken = meds.filter((m) => m.status === "Taken").length;
  const pending = meds.filter((m) => m.status === "Pending").length;
  const missed = meds.filter((m) => m.status === "Missed").length;
  const total = meds.length || 1;
  const pct = Math.round((taken / total) * 100);

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (m: Medication) => {
    setEditing(m);
    setModalOpen(true);
  };

  const handleSave = async (data: Omit<Medication, "id" | "status"> & { status?: Medication["status"] }) => {
    const full = { ...data, status: data.status ?? ("Pending" as Medication["status"]) };
    try {
      if (editing) {
        await medicationsStore.update(editing.id, full);
        toast.success("Medication updated successfully");
      } else {
        await medicationsStore.add(full);
        toast.success("Medication added successfully");
      }
      setModalOpen(false);
      setEditing(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to save medication");
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await medicationsStore.remove(deleting.id);
      toast.success("Medication deleted");
      setDeleting(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete medication");
    }
  };

  const markTaken = async (m: Medication) => {
    try {
      await medicationsStore.update(m.id, { status: "Taken" });
      toast.success(`${m.name} marked as taken`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update medication status");
    }
  };

  return (
    <AppLayout>
      <Topbar
        greeting={isDoctor ? "Doctor Prescriptions" : "Medications"}
        subtitle={
          isDoctor
            ? "Prescribe medications by disease and titrate dosages based on clinical improvement."
            : "Track your daily medicine schedule."
        }
      />

      <PageHeader
        title={isDoctor ? "Prescriptions & Titration" : "Medications"}
        subtitle={
          isDoctor
            ? "Manage patient disease therapies and safely titrate dosages."
            : "Manage medication reminders and compliance."
        }
        actions={
          isDoctor ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPrescribeOpen(true)}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:opacity-90 transition shadow-sm"
              >
                <Stethoscope className="h-4 w-4" /> Prescribe to Patient
              </button>
              <button
                onClick={openNew}
                className="inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border border-border bg-card text-[13px] font-medium hover:bg-hover transition"
              >
                <Plus className="h-4 w-4" /> Add Med
              </button>
            </div>
          ) : (
            <button
              onClick={openNew}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-[13.5px] font-medium hover:opacity-90 transition"
            >
              <Plus className="h-4 w-4" /> Add Medication
            </button>
          )
        }
      />

      {/* Doctor Clinical Banner */}
      {isDoctor && (
        <div className="mb-6 p-4 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground grid place-items-center shrink-0">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[14px] font-semibold text-foreground">
                Clinical Pharmacotherapy & Dose Titration Hub
              </div>
              <div className="text-[12px] text-muted-foreground">
                Monitor patient therapeutic response. When disease improves, use{" "}
                <strong className="text-foreground">Adjust Dose (Titrate)</strong> to decrease dosage safely.
              </div>
            </div>
          </div>
          <button
            onClick={() => setPrescribeOpen(true)}
            className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-[12px] font-semibold inline-flex items-center gap-1.5 shrink-0 hover:opacity-90 transition"
          >
            <Plus className="h-3.5 w-3.5" /> Prescribe Medication
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 card-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-semibold">Today's Timeline</h3>
            <span className="text-[12px] text-muted-foreground">{meds.length} medications</span>
          </div>
          <div className="grid grid-cols-4 gap-3 mb-4">
            {slots.map((s) => {
              const c = meds.filter((m) => m.slot === s.label).length;
              return (
                <div key={s.label} className="rounded-xl border border-border p-3 text-center bg-background">
                  <s.icon className={`h-5 w-5 mx-auto ${s.color}`} />
                  <div className="text-[13px] font-medium mt-1.5">{s.label}</div>
                  <div className="text-[20px] font-semibold leading-none mt-1">{c}</div>
                </div>
              );
            })}
          </div>
          <ol className="relative pl-4 border-l-2 border-border space-y-3">
            {meds.map((m) => (
              <li key={m.id} className="relative pl-4">
                <span className="absolute -left-[7px] top-2 h-3 w-3 rounded-full bg-primary ring-4 ring-card" />
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-hover transition">
                  <div className="min-w-0">
                    <div className="text-[14px] font-medium truncate">
                      {formatTime(m.time)} · {m.name}
                    </div>
                    <div className="text-[12px] text-muted-foreground truncate">
                      {m.dosage} · {m.slot}
                      {m.disease ? ` · Condition: ${m.disease}` : ""}
                      {m.patientName ? ` · Patient: ${m.patientName}` : ""}
                    </div>
                  </div>
                  <StatusBadge tone={tone[m.status]}>{m.status}</StatusBadge>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="card-surface p-6">
          <h3 className="text-[16px] font-semibold mb-4">
            {isDoctor ? "Patient Adherence" : "Compliance"}
          </h3>
          <div className="grid place-items-center">
            <div className="relative">
              <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
                <circle cx="90" cy="90" r="70" fill="none" stroke="var(--color-secondary)" strokeWidth="14" />
                <circle
                  cx="90"
                  cy="90"
                  r="70"
                  fill="none"
                  stroke="var(--color-success)"
                  strokeWidth="14"
                  strokeDasharray={`${(pct / 100) * 2 * Math.PI * 70} 999`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <div className="text-[30px] font-semibold leading-none">{pct}%</div>
                  <div className="text-[12px] text-muted-foreground mt-1">Today</div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5 space-y-2.5">
            <Row label="Taken" val={taken} dot="bg-success" />
            <Row label="Pending" val={pending} dot="bg-warning" />
            <Row label="Missed" val={missed} dot="bg-danger" />
          </div>
        </div>
      </div>

      <div className="card-surface p-4 mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={isDoctor ? "Search by medicine, patient name, disease, condition..." : "Search medicines…"}
              className="w-full h-10 pl-10 pr-3 rounded-xl bg-background border border-border text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="inline-flex rounded-xl border border-border bg-background p-1 flex-wrap">
            {["All", "Morning", "Afternoon", "Evening", "Night"].map((t) => (
              <button
                key={t}
                onClick={() => setSlot(t)}
                className={`h-8 px-3 rounded-lg text-[12.5px] ${
                  slot === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.length === 0 && (
          <div className="col-span-full card-surface p-10 text-center text-[13px] text-muted-foreground">
            No medications found.
          </div>
        )}
        {list.map((m) => {
          const isHighlighted = m.id === highlightedId;
          return (
            <div
              key={m.id}
              className={`card-surface hover-lift p-5 transition-all duration-300 ${
                isHighlighted ? "ring-2 ring-primary border-primary bg-primary/5 shadow-md" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary grid place-items-center">
                    <Pill className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold">{m.name}</div>
                    <div className="text-[12.5px] text-muted-foreground font-medium">{m.dosage}</div>
                  </div>
                </div>
                <StatusBadge tone={tone[m.status]}>{m.status}</StatusBadge>
              </div>

              {/* Linked Disease & Patient Badges */}
              {(m.disease || m.patientName || m.prescribedBy) && (
                <div className="mt-3 pt-3 border-t border-border/60 space-y-1.5">
                  {m.disease && (
                    <div className="inline-flex items-center gap-1.5 text-[11.5px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium max-w-full truncate">
                      <Activity className="h-3 w-3 shrink-0" />
                      <span className="truncate">Disease: {m.disease}</span>
                    </div>
                  )}
                  {m.patientName && (
                    <div className="text-[12px] text-muted-foreground flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-success shrink-0" />
                      <span className="truncate">
                        Patient: <strong className="text-foreground">{m.patientName}</strong>
                      </span>
                    </div>
                  )}
                  {m.prescribedBy && (
                    <div className="text-[11.5px] text-muted-foreground flex items-center gap-1.5">
                      <Stethoscope className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">{m.prescribedBy}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-3 grid grid-cols-2 gap-3 text-[12.5px]">
                <div>
                  <div className="text-muted-foreground">Time</div>
                  <div className="font-medium">{formatTime(m.time)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Slot</div>
                  <div className="font-medium">{m.slot}</div>
                </div>
              </div>

              {m.notes && (
                <p className="mt-2 text-[12px] text-muted-foreground line-clamp-2 bg-secondary/30 p-2 rounded-lg border border-border/50">
                  {m.notes}
                </p>
              )}

              <div className="mt-4 flex items-center gap-2">
                {isDoctor ? (
                  <button
                    onClick={() => setTitrationMed(m)}
                    className="flex-1 h-9 rounded-lg bg-success/15 text-success hover:bg-success/20 text-[12px] font-semibold inline-flex items-center justify-center gap-1.5 transition"
                    title="Adjust and taper dose based on clinical improvement"
                  >
                    <TrendingDown className="h-3.5 w-3.5" /> Adjust Dose (Titrate)
                  </button>
                ) : (
                  <button
                    onClick={() => markTaken(m)}
                    className="flex-1 h-9 rounded-lg bg-success/10 text-success text-[12.5px] font-medium inline-flex items-center justify-center gap-1.5 hover:bg-success/15"
                  >
                    <Check className="h-3.5 w-3.5" /> Mark Taken
                  </button>
                )}
                <button
                  onClick={() => handleSendSms(m)}
                  disabled={sendingSmsId === m.id}
                  className="h-9 w-9 grid place-items-center rounded-lg hover:bg-primary/10 text-primary transition disabled:opacity-50"
                  title="Send Twilio SMS Reminder Now"
                >
                  <MessageSquare className="h-4 w-4" />
                </button>
                <button
                  onClick={() => openEdit(m)}
                  className="h-9 w-9 grid place-items-center rounded-lg hover:bg-secondary text-muted-foreground"
                  title="Edit Medication"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleting(m)}
                  className="h-9 w-9 grid place-items-center rounded-lg hover:bg-danger/10 text-danger"
                  title="Delete Medication"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <MedicationModal open={modalOpen} onClose={() => setModalOpen(false)} initial={editing} onSave={handleSave} />
      <DoctorPrescribeModal open={prescribeOpen} onClose={() => setPrescribeOpen(false)} />
      <DosageTitrationModal open={!!titrationMed} onClose={() => setTitrationMed(null)} medication={titrationMed} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Medication"
        message={`Remove ${deleting?.name ?? "this medicine"} from medications?`}
        confirmLabel="Delete"
      />
    </AppLayout>
  );
}

function Row({ label, val, dot }: { label: string; val: number; dot: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
      <span className="text-[13.5px] flex-1">{label}</span>
      <span className="text-[13.5px] font-medium">{val}</span>
    </div>
  );
}
