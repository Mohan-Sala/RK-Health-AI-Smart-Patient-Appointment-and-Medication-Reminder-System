import { useEffect, useState } from "react";
import { Modal, Field, ModalFooter, inputCls, textareaCls } from "./Modal";
import { authStore, patientStore, type Medication } from "@/lib/store";
import { UserCheck, Activity } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  initial?: Medication | null;
  onSave: (data: Omit<Medication, "id" | "status"> & { status?: Medication["status"] }) => void;
};

const empty = {
  name: "",
  dosage: "",
  strength: "",
  type: "Tablet" as Medication["type"],
  frequency: "Once Daily" as Medication["frequency"],
  time: "09:00",
  slot: "Morning" as Medication["slot"],
  startDate: "",
  endDate: "",
  foodPref: "After Food" as Medication["foodPref"],
  phone: "+91 ",
  reminderEnabled: true,
  notes: "",
  patientId: "",
  patientName: "",
  disease: "",
  prescribedBy: "",
};

function slotForTime(t: string): Medication["slot"] {
  const h = parseInt(t.split(":")[0] || "0", 10);
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  if (h < 20) return "Evening";
  return "Night";
}

export function MedicationModal({ open, onClose, initial, onSave }: Props) {
  const user = authStore.use();
  const isDoctor = user?.role === "doctor";
  const patients = patientStore.use();

  const [v, setV] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      patientStore.hydrate();
      setV(initial ? { ...empty, ...initial } : empty);
      setErrors({});
    }
  }, [open, initial]);

  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => setV((p) => ({ ...p, [k]: val }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!v.name.trim()) e.name = "Medicine name required";
    if (!v.dosage.trim()) e.dosage = "Dosage required";
    if (!v.time) e.time = "Reminder time required";
    if (!v.startDate) e.startDate = "Start date required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    onSave({ ...v, slot: slotForTime(v.time) });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        initial
          ? isDoctor
            ? "Edit Patient Prescription"
            : "Edit Medication"
          : isDoctor
          ? "Prescribe Medication"
          : "Add New Medication"
      }
    >
      <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {(isDoctor || v.patientId || v.patientName) && (
          <>
            <Field label="Assigned Patient" className="md:col-span-2">
              <select
                className={inputCls}
                value={v.patientId || ""}
                onChange={(e) => {
                  const pid = e.target.value;
                  const found = patients.find((p) => p.id === pid);
                  setV((prev) => ({
                    ...prev,
                    patientId: pid,
                    patientName: found ? found.fullName : prev.patientName,
                    phone: found?.phone || prev.phone,
                  }));
                }}
              >
                {v.patientName && !patients.some((p) => p.id === v.patientId) && (
                  <option value={v.patientId}>{v.patientName}</option>
                )}
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.email})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Target Disease / Condition" className="md:col-span-2">
              <input
                className={inputCls}
                value={v.disease || ""}
                onChange={(e) => set("disease", e.target.value)}
                placeholder="e.g. Hypertension, Type 2 Diabetes, Asthma"
              />
            </Field>
          </>
        )}

        <Field label="Medicine Name" required error={errors.name} className="md:col-span-2">
          <input className={inputCls} value={v.name} onChange={(e) => set("name", e.target.value)} placeholder="Enter medicine name" />
        </Field>
        <Field label="Dosage" required error={errors.dosage}>
          <input className={inputCls} value={v.dosage} onChange={(e) => set("dosage", e.target.value)} placeholder="e.g. 1 Tablet or 5mg" />
        </Field>
        <Field label="Strength">
          <input className={inputCls} value={v.strength} onChange={(e) => set("strength", e.target.value)} placeholder="e.g. 500mg" />
        </Field>
        <Field label="Medicine Type">
          <select className={inputCls} value={v.type} onChange={(e) => set("type", e.target.value as Medication["type"])}>
            <option>Tablet</option><option>Capsule</option><option>Syrup</option><option>Injection</option><option>Drops</option>
          </select>
        </Field>
        <Field label="Frequency">
          <select className={inputCls} value={v.frequency} onChange={(e) => set("frequency", e.target.value as Medication["frequency"])}>
            <option>Once Daily</option><option>Twice Daily</option><option>Three Times Daily</option><option>Weekly</option><option>Monthly</option>
          </select>
        </Field>
        <Field label="Reminder Time" required error={errors.time}>
          <input type="time" className={inputCls} value={v.time} onChange={(e) => set("time", e.target.value)} />
        </Field>
        <Field label="Food Preference">
          <select className={inputCls} value={v.foodPref} onChange={(e) => set("foodPref", e.target.value as Medication["foodPref"])}>
            <option>Before Food</option><option>After Food</option><option>With Food</option>
          </select>
        </Field>
        <Field label="Start Date" required error={errors.startDate}>
          <input type="date" className={inputCls} value={v.startDate} onChange={(e) => set("startDate", e.target.value)} />
        </Field>
        <Field label="End Date">
          <input type="date" className={inputCls} value={v.endDate} onChange={(e) => set("endDate", e.target.value)} />
        </Field>
        <Field label="Phone Number" className="md:col-span-2">
          <input className={inputCls} value={v.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98765 43210" />
        </Field>
        <Field label="Reminder Enabled" className="md:col-span-2">
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-background">
            <span className="text-[13.5px] text-muted-foreground">Send SMS reminders for this medicine</span>
            <button
              type="button"
              onClick={() => set("reminderEnabled", !v.reminderEnabled)}
              className={`relative h-6 w-11 rounded-full transition ${v.reminderEnabled ? "bg-primary" : "bg-muted"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${v.reminderEnabled ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>
        </Field>
        <Field label="Notes" className="md:col-span-2">
          <textarea rows={3} className={textareaCls} value={v.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Enter notes (optional)" />
        </Field>
      </div>
      <ModalFooter>
        <button onClick={onClose} className="h-10 px-5 rounded-xl border border-border text-[13.5px] hover:bg-hover transition">Cancel</button>
        <button onClick={submit} className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-[13.5px] font-medium hover:opacity-90 transition">
          {initial ? "Save Changes" : "Save Medication"}
        </button>
      </ModalFooter>
    </Modal>
  );
}
