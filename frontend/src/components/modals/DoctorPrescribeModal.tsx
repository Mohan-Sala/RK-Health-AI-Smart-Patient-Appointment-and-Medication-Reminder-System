import { useState, useEffect } from "react";
import { Modal, ModalFooter } from "./Modal";
import { patientStore, medicationsStore, type Medication } from "@/lib/store";
import { Pill, UserCheck, Stethoscope, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
  preselectedPatientId?: string;
  preselectedDisease?: string;
};

const COMMON_DISEASES = [
  "Hypertension (High Blood Pressure)",
  "Type 2 Diabetes Mellitus",
  "Bronchial Asthma / COPD",
  "Hyperlipidemia (High Cholesterol)",
  "Bacterial Upper Respiratory Infection",
  "Cardiovascular Coronary Artery Disease",
  "GERD / Acid Peptic Disease",
  "Chronic Migraine / Neuropathic Pain",
  "Osteoarthritis / Joint Inflammation",
  "Hypothyroidism",
];

const SEVERITY_LEVELS = [
  "Acute / Active Flare",
  "Moderate / Initial Treatment",
  "Sub-acute / Stabilizing",
  "Improving / Step-down Therapy",
  "Maintenance / Long-term Control",
];

const COMMON_MEDICATIONS = [
  { name: "Amlodipine", dosage: "5 mg", strength: "5mg", type: "Tablet", freq: "Once Daily", time: "09:00" },
  { name: "Metformin", dosage: "500 mg", strength: "500mg", type: "Tablet", freq: "Twice Daily", time: "08:30" },
  { name: "Lisinopril", dosage: "10 mg", strength: "10mg", type: "Tablet", freq: "Once Daily", time: "09:00" },
  { name: "Atorvastatin", dosage: "20 mg", strength: "20mg", type: "Tablet", freq: "Once Daily", time: "21:00" },
  { name: "Amoxicillin", dosage: "500 mg", strength: "500mg", type: "Capsule", freq: "Three Times Daily", time: "08:00" },
  { name: "Pantoprazole", dosage: "40 mg", strength: "40mg", type: "Tablet", freq: "Once Daily", time: "07:30" },
  { name: "Montelukast", dosage: "10 mg", strength: "10mg", type: "Tablet", freq: "Once Daily", time: "20:30" },
];

function slotForTime(t: string): Medication["slot"] {
  const h = parseInt(t.split(":")[0] || "0", 10);
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  if (h < 20) return "Evening";
  return "Night";
}

export function DoctorPrescribeModal({ open, onClose, preselectedPatientId, preselectedDisease }: Props) {
  useEffect(() => {
    patientStore.hydrate();
  }, [open]);

  const patients = patientStore.use();

  const [patientId, setPatientId] = useState(preselectedPatientId || "");
  const [disease, setDisease] = useState(preselectedDisease || "");
  const [customDisease, setCustomDisease] = useState("");
  const [severity, setSeverity] = useState(SEVERITY_LEVELS[1]);
  const [medName, setMedName] = useState("");
  const [dosage, setDosage] = useState("");
  const [strength, setStrength] = useState("");
  const [medType, setMedType] = useState<Medication["type"]>("Tablet");
  const [frequency, setFrequency] = useState<Medication["frequency"]>("Once Daily");
  const [time, setTime] = useState("09:00");
  const [foodPref, setFoodPref] = useState<Medication["foodPref"]>("After Food");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (preselectedPatientId) setPatientId(preselectedPatientId);
      else if (patients.length > 0 && !patientId) setPatientId(patients[0].id);
      if (preselectedDisease) setDisease(preselectedDisease);
    }
  }, [open, preselectedPatientId, preselectedDisease, patients]);

  const selectedPatient = patients.find((p) => p.id === patientId);

  const applyMedicationPreset = (preset: typeof COMMON_MEDICATIONS[0]) => {
    setMedName(preset.name);
    setDosage(preset.dosage);
    setStrength(preset.strength);
    setMedType(preset.type as Medication["type"]);
    setFrequency(preset.freq as Medication["frequency"]);
    setTime(preset.time);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) {
      toast.error("Please select a patient for this prescription.");
      return;
    }
    const finalDisease = customDisease.trim() || disease || "General Care";
    if (!medName.trim()) {
      toast.error("Please enter a medicine name.");
      return;
    }
    if (!dosage.trim()) {
      toast.error("Please specify the dosage.");
      return;
    }

    setSubmitting(true);
    try {
      const fullNotes = notes
        ? `[Condition: ${finalDisease} · Stage: ${severity}] ${notes}`
        : `Prescribed for ${finalDisease} (${severity}). Review dosage upon disease improvement.`;

      await medicationsStore.prescribe({
        patientId,
        disease: finalDisease,
        name: medName.trim(),
        dosage: dosage.trim(),
        strength: strength.trim(),
        type: medType,
        frequency,
        time,
        slot: slotForTime(time),
        startDate,
        endDate,
        foodPref,
        phone: selectedPatient?.phone || "",
        reminderEnabled: true,
        notes: fullNotes,
        status: "Pending",
      });

      toast.success(
        `Prescription for ${medName} (${dosage}) created and assigned to ${
          selectedPatient ? selectedPatient.fullName : "patient"
        }!`
      );
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to prescribe medication.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Doctor Prescription Portal">
      <form onSubmit={handleSubmit}>
        <div className="px-6 py-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Header banner */}
          <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground grid place-items-center shrink-0">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[13.5px] font-semibold text-foreground">
                Prescribe Medication & Link Clinical Condition
              </div>
              <div className="text-[12px] text-muted-foreground">
                Medication will be assigned directly to patient profile with instant SMS/push notification.
              </div>
            </div>
          </div>

          {/* 1. Patient Selection */}
          <div>
            <label className="text-[12.5px] font-medium text-foreground/80 mb-1.5 flex items-center justify-between">
              <span>Select Patient</span>
              <span className="text-[11.5px] text-primary">{patients.length} registered patients</span>
            </label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-background border border-border text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/25"
              required
            >
              {patients.length === 0 && <option value="">No patients registered yet</option>}
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} · {p.email} {p.gender ? `(${p.gender})` : ""}
                </option>
              ))}
            </select>

            {selectedPatient && (
              <div className="mt-2 p-2.5 rounded-xl bg-secondary/50 border border-border text-[12px] flex items-center gap-3">
                <UserCheck className="h-4 w-4 text-success shrink-0" />
                <span className="truncate">
                  Patient: <strong className="text-foreground">{selectedPatient.fullName}</strong>
                  {selectedPatient.medicalConditions && ` · Conditions: ${selectedPatient.medicalConditions}`}
                  {selectedPatient.allergies && ` · Allergies: ${selectedPatient.allergies}`}
                </span>
              </div>
            )}
          </div>

          {/* 2. Disease / Condition */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[12.5px] font-medium text-foreground/80 mb-1.5 block">
                Target Disease / Condition
              </label>
              <select
                value={disease}
                onChange={(e) => {
                  setDisease(e.target.value);
                  if (e.target.value !== "Other") setCustomDisease("");
                }}
                className="w-full h-11 px-3 rounded-xl bg-background border border-border text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/25"
              >
                <option value="">-- Choose Diagnosis / Condition --</option>
                {COMMON_DISEASES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
                <option value="Other">Other / Custom Condition</option>
              </select>

              {(disease === "Other" || !COMMON_DISEASES.includes(disease)) && (
                <input
                  type="text"
                  placeholder="Enter custom disease name..."
                  value={customDisease}
                  onChange={(e) => setCustomDisease(e.target.value)}
                  className="mt-2 w-full h-10 px-3 rounded-xl bg-background border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/25"
                />
              )}
            </div>

            <div>
              <label className="text-[12.5px] font-medium text-foreground/80 mb-1.5 block">
                Condition Severity & Stage
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-background border border-border text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/25"
              >
                {SEVERITY_LEVELS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Preset Meds */}
          <div>
            <div className="text-[12px] font-medium text-muted-foreground mb-1.5">Quick Clinical Formularies:</div>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_MEDICATIONS.map((m) => (
                <button
                  key={m.name}
                  type="button"
                  onClick={() => applyMedicationPreset(m)}
                  className="text-[11.5px] px-2.5 py-1 rounded-lg border border-border bg-secondary/40 hover:bg-primary/10 hover:border-primary/40 transition"
                >
                  + {m.name} ({m.dosage})
                </button>
              ))}
            </div>
          </div>

          {/* 3. Medicine Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="text-[12.5px] font-medium text-foreground/80 mb-1.5 block">Medicine Name</label>
              <input
                type="text"
                placeholder="e.g. Amlodipine"
                value={medName}
                onChange={(e) => setMedName(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-background border border-border text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/25"
                required
              />
            </div>
            <div>
              <label className="text-[12.5px] font-medium text-foreground/80 mb-1.5 block">Prescribed Dosage</label>
              <input
                type="text"
                placeholder="e.g. 10 mg or 1 Tab"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-background border border-border text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/25"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[12.5px] font-medium text-foreground/80 mb-1.5 block">Form / Type</label>
              <select
                value={medType}
                onChange={(e) => setMedType(e.target.value as Medication["type"])}
                className="w-full h-10 px-2.5 rounded-xl bg-background border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/25"
              >
                <option>Tablet</option>
                <option>Capsule</option>
                <option>Syrup</option>
                <option>Injection</option>
                <option>Drops</option>
              </select>
            </div>
            <div>
              <label className="text-[12.5px] font-medium text-foreground/80 mb-1.5 block">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as Medication["frequency"])}
                className="w-full h-10 px-2.5 rounded-xl bg-background border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/25"
              >
                <option>Once Daily</option>
                <option>Twice Daily</option>
                <option>Three Times Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </div>
            <div>
              <label className="text-[12.5px] font-medium text-foreground/80 mb-1.5 block">Intake Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-10 px-2.5 rounded-xl bg-background border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/25"
                required
              />
            </div>
            <div>
              <label className="text-[12.5px] font-medium text-foreground/80 mb-1.5 block">Food Pref</label>
              <select
                value={foodPref}
                onChange={(e) => setFoodPref(e.target.value as Medication["foodPref"])}
                className="w-full h-10 px-2.5 rounded-xl bg-background border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/25"
              >
                <option>After Food</option>
                <option>Before Food</option>
                <option>With Food</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[12.5px] font-medium text-foreground/80 mb-1.5 block">Prescription Start</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-background border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/25"
                required
              />
            </div>
            <div>
              <label className="text-[12.5px] font-medium text-foreground/80 mb-1.5 block">Prescription End</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-background border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/25"
                required
              />
            </div>
          </div>

          {/* Clinical Instructions */}
          <div>
            <label className="text-[12.5px] font-medium text-foreground/80 mb-1.5 block">
              Clinical Instructions & Titration Plan
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Initial therapy dose. Re-assess BP at 2 weeks. Dosage will be tapered to 5mg upon blood pressure normalization."
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/25 resize-none"
            />
          </div>
        </div>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-xl border border-border text-[13px] font-medium hover:bg-hover transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition inline-flex items-center gap-2"
          >
            <Pill className="h-4 w-4" />
            {submitting ? "Prescribing..." : "Prescribe to Patient"}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
