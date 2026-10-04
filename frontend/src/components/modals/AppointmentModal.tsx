import { useEffect, useState } from "react";
import { Modal, Field, ModalFooter, inputCls, textareaCls } from "./Modal";
import { authStore, type Appointment } from "@/lib/store";

type Props = {
  open: boolean;
  onClose: () => void;
  initial?: Appointment | null;
  onSave: (data: Omit<Appointment, "id" | "status"> & { status?: Appointment["status"] }) => void;
};

const empty = {
  patient: "",
  doctor: "",
  title: "",
  hospital: "",
  spec: "",
  date: "",
  time: "",
  phone: "+91 ",
  email: "",
  visitType: "Consultation" as Appointment["visitType"],
  priority: "Medium" as Appointment["priority"],
  notes: "",
};

export function AppointmentModal({ open, onClose, initial, onSave }: Props) {
  const [v, setV] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      const currentUser = authStore.getCurrentUser();
      const defaultPatient = currentUser ? currentUser.name : "";
      setV(initial ? { ...empty, ...initial } : { ...empty, patient: defaultPatient });
      setErrors({});
    }
  }, [open, initial]);

  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => setV((p) => ({ ...p, [k]: val }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!v.patient.trim()) e.patient = "Patient name required";
    if (!v.doctor.trim()) e.doctor = "Doctor name required";
    if (!v.title.trim()) e.title = "Title required";
    if (!v.date) e.date = "Date required";
    if (!v.time) e.time = "Time required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    const today = new Date().toISOString().slice(0, 10);
    const status: Appointment["status"] = v.date === today ? "Today" : v.date < today ? "Completed" : "Upcoming";
    onSave({ ...v, status });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Appointment" : "Add New Appointment"}>
      <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Patient Name" required error={errors.patient}>
          <input className={inputCls} value={v.patient} onChange={(e) => set("patient", e.target.value)} placeholder="Enter patient name" />
        </Field>
        <Field label="Doctor Name" required error={errors.doctor}>
          <input className={inputCls} value={v.doctor} onChange={(e) => set("doctor", e.target.value)} placeholder="Select doctor" />
        </Field>
        <Field label="Appointment Title" required error={errors.title} className="md:col-span-2">
          <input className={inputCls} value={v.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. General Consultation" />
        </Field>
        <Field label="Hospital / Clinic">
          <input className={inputCls} value={v.hospital} onChange={(e) => set("hospital", e.target.value)} placeholder="Enter location" />
        </Field>
        <Field label="Specialization">
          <input className={inputCls} value={v.spec} onChange={(e) => set("spec", e.target.value)} placeholder="e.g. Cardiologist" />
        </Field>
        <Field label="Appointment Date" required error={errors.date}>
          <input type="date" className={inputCls} value={v.date} onChange={(e) => set("date", e.target.value)} />
        </Field>
        <Field label="Appointment Time" required error={errors.time}>
          <input type="time" className={inputCls} value={v.time} onChange={(e) => set("time", e.target.value)} />
        </Field>
        <Field label="Phone Number">
          <input className={inputCls} value={v.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98765 43210" />
        </Field>
        <Field label="Email">
          <input type="email" className={inputCls} value={v.email} onChange={(e) => set("email", e.target.value)} placeholder="email@example.com" />
        </Field>
        <Field label="Visit Type">
          <select className={inputCls} value={v.visitType} onChange={(e) => set("visitType", e.target.value as Appointment["visitType"])}>
            <option>Consultation</option><option>Follow-up</option><option>Emergency</option><option>Routine Checkup</option>
          </select>
        </Field>
        <Field label="Priority">
          <select className={inputCls} value={v.priority} onChange={(e) => set("priority", e.target.value as Appointment["priority"])}>
            <option>Low</option><option>Medium</option><option>High</option>
          </select>
        </Field>
        <Field label="Notes" className="md:col-span-2">
          <textarea rows={3} className={textareaCls} value={v.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Enter notes (optional)" />
        </Field>
      </div>
      <ModalFooter>
        <button onClick={onClose} className="h-10 px-5 rounded-xl border border-border text-[13.5px] hover:bg-hover transition">Cancel</button>
        <button onClick={submit} className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-[13.5px] font-medium hover:opacity-90 transition">
          {initial ? "Save Changes" : "Save Appointment"}
        </button>
      </ModalFooter>
    </Modal>
  );
}
