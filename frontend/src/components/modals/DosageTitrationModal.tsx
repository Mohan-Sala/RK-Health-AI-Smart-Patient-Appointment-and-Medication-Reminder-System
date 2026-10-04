import { useState, useEffect } from "react";
import { Modal, ModalFooter } from "./Modal";
import { medicationsStore, type Medication, authStore } from "@/lib/store";
import { TrendingDown, ArrowDownRight, Activity, ShieldCheck, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
  medication: Medication | null;
};

const IMPROVEMENT_LEVELS = [
  {
    id: "significant",
    label: "Significant Improvement (Recommended: Decrease / Taper Dose)",
    direction: "decrease",
    badge: "Clinical Remission / Major Recovery",
    badgeColor: "bg-success/15 text-success border-success/30",
    defaultReason: "Patient shows marked clinical improvement in disease markers. Tapering dosage downward to optimal maintenance level.",
  },
  {
    id: "moderate",
    label: "Moderate Improvement (Mild Step-Down)",
    direction: "decrease",
    badge: "Positive Progress",
    badgeColor: "bg-primary/15 text-primary border-primary/30",
    defaultReason: "Disease indicators stabilized with steady recovery. Adjusting dose to lower threshold to minimize drug dependency.",
  },
  {
    id: "stable",
    label: "Condition Stable (Maintain Current Dose)",
    direction: "maintain",
    badge: "Disease Controlled",
    badgeColor: "bg-secondary text-foreground border-border",
    defaultReason: "Condition is well controlled on existing dosage. Maintaining therapeutic regimen.",
  },
  {
    id: "relapse",
    label: "Condition Active / Flare (Increase Dose)",
    direction: "increase",
    badge: "Active Flare",
    badgeColor: "bg-danger/15 text-danger border-danger/30",
    defaultReason: "Symptoms escalated or target biomarker thresholds exceeded. Titrating dosage upward under clinical observation.",
  },
];

export function DosageTitrationModal({ open, onClose, medication }: Props) {
  const [selectedLevelId, setSelectedLevelId] = useState("significant");
  const [newDosage, setNewDosage] = useState("");
  const [newFrequency, setNewFrequency] = useState<Medication["frequency"]>("Once Daily");
  const [improvementNote, setImprovementNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const doctor = authStore.use();

  useEffect(() => {
    if (medication && open) {
      setSelectedLevelId("significant");
      setNewFrequency(medication.frequency);

      // Auto-calculate suggested lower dose if numeric
      const numericMatch = medication.dosage.match(/(\d+(\.\d+)?)/);
      if (numericMatch) {
        const val = parseFloat(numericMatch[0]);
        const unit = medication.dosage.replace(numericMatch[0], "").trim() || "mg";
        const halved = val > 1 ? val / 2 : val;
        setNewDosage(`${halved} ${unit}`);
      } else {
        setNewDosage(medication.dosage);
      }

      setImprovementNote(IMPROVEMENT_LEVELS[0].defaultReason);
    }
  }, [medication, open]);

  if (!medication) return null;

  const currentLevel = IMPROVEMENT_LEVELS.find((l) => l.id === selectedLevelId) || IMPROVEMENT_LEVELS[0];

  const handleLevelChange = (levelId: string) => {
    setSelectedLevelId(levelId);
    const lvl = IMPROVEMENT_LEVELS.find((l) => l.id === levelId);
    if (!lvl) return;

    setImprovementNote(lvl.defaultReason);

    const numericMatch = medication.dosage.match(/(\d+(\.\d+)?)/);
    if (numericMatch) {
      const val = parseFloat(numericMatch[0]);
      const unit = medication.dosage.replace(numericMatch[0], "").trim() || "mg";
      if (lvl.direction === "decrease") {
        const reduced = val > 1 ? val / 2 : val;
        setNewDosage(`${reduced} ${unit}`);
      } else if (lvl.direction === "increase") {
        setNewDosage(`${val * 1.5} ${unit}`);
      } else {
        setNewDosage(medication.dosage);
      }
    }
  };

  const applyDoseCut = (factor: number) => {
    const numericMatch = medication.dosage.match(/(\d+(\.\d+)?)/);
    if (numericMatch) {
      const val = parseFloat(numericMatch[0]);
      const unit = medication.dosage.replace(numericMatch[0], "").trim() || "mg";
      const calculated = Math.round(val * factor * 10) / 10;
      setNewDosage(`${calculated} ${unit}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDosage.trim()) {
      toast.error("Please enter the new dosage.");
      return;
    }

    setSubmitting(true);
    try {
      const fullNote = `[Clinical Assessment: ${currentLevel.badge}] ${improvementNote.trim()}`;
      await medicationsStore.adjustDosage(
        medication.id,
        newDosage.trim(),
        fullNote,
        newFrequency,
        medication.notes ? `${medication.notes} | Dose titrated to ${newDosage} on ${new Date().toLocaleDateString()}` : undefined
      );

      toast.success(
        `Dosage updated: ${medication.name} adjusted from ${medication.dosage} to ${newDosage}. Patient notified of clinical improvement!`
      );
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to adjust medication dosage.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Dosage Titration & Disease Progress">
      <form onSubmit={handleSubmit}>
        <div className="px-6 py-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Active Medication Card */}
          <div className="p-4 rounded-2xl bg-secondary/50 border border-border flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold text-foreground">{medication.name}</span>
                <span className="text-[12px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  Current: {medication.dosage}
                </span>
              </div>
              <div className="text-[12.5px] text-muted-foreground mt-1 space-y-0.5">
                {medication.disease && (
                  <div>
                    Target Disease: <strong className="text-foreground">{medication.disease}</strong>
                  </div>
                )}
                {medication.patientName && (
                  <div>
                    Patient: <strong className="text-foreground">{medication.patientName}</strong>
                  </div>
                )}
                <div>Current Regimen: {medication.frequency} · {medication.slot}</div>
              </div>
            </div>

            <div className="h-10 w-10 rounded-xl bg-success/10 text-success grid place-items-center shrink-0">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>

          {/* 1. Disease Improvement Assessment */}
          <div>
            <label className="text-[12.5px] font-medium text-foreground/80 mb-2 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-primary" />
              Patient Disease Progression & Clinical Response
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {IMPROVEMENT_LEVELS.map((lvl) => {
                const isSelected = selectedLevelId === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => handleLevelChange(lvl.id)}
                    className={`text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                        : "border-border bg-background hover:bg-hover"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-foreground">{lvl.label}</div>
                      <div className="text-[11.5px] text-muted-foreground mt-0.5 truncate">{lvl.defaultReason}</div>
                    </div>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${lvl.badgeColor}`}>
                      {lvl.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Dose Taper Chips */}
          <div>
            <div className="text-[12px] font-medium text-muted-foreground mb-1.5 flex items-center justify-between">
              <span>Quick Taper Calculations (Step-Down):</span>
              <span className="text-[11px] text-success font-medium">Safe clinical step-down</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyDoseCut(0.5)}
                className="text-[12px] px-3 py-1.5 rounded-lg border border-border bg-secondary/50 hover:bg-primary/10 hover:border-primary/40 font-medium inline-flex items-center gap-1.5 transition"
              >
                <ArrowDownRight className="h-3.5 w-3.5 text-success" /> -50% Taper (Half Dose)
              </button>
              <button
                type="button"
                onClick={() => applyDoseCut(0.75)}
                className="text-[12px] px-3 py-1.5 rounded-lg border border-border bg-secondary/50 hover:bg-primary/10 hover:border-primary/40 font-medium inline-flex items-center gap-1.5 transition"
              >
                <ArrowDownRight className="h-3.5 w-3.5 text-success" /> -25% Taper (Minor step)
              </button>
              <button
                type="button"
                onClick={() => setNewDosage(medication.dosage)}
                className="text-[12px] px-3 py-1.5 rounded-lg border border-border bg-secondary/50 hover:bg-hover font-medium text-muted-foreground transition"
              >
                Reset to Current
              </button>
            </div>
          </div>

          {/* 2. New Dosage and Frequency inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[12.5px] font-medium text-foreground/80 mb-1.5 block">
                New Titrated Dosage <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. 5 mg or 0.5 Tab"
                  value={newDosage}
                  onChange={(e) => setNewDosage(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-background border border-border text-[13.5px] font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
                  required
                />
              </div>
              <p className="text-[11.5px] text-muted-foreground mt-1">
                Was: <span className="line-through">{medication.dosage}</span> → Now:{" "}
                <span className="font-semibold text-success">{newDosage || "..."}</span>
              </p>
            </div>

            <div>
              <label className="text-[12.5px] font-medium text-foreground/80 mb-1.5 block">
                Updated Administration Frequency
              </label>
              <select
                value={newFrequency}
                onChange={(e) => setNewFrequency(e.target.value as Medication["frequency"])}
                className="w-full h-11 px-3 rounded-xl bg-background border border-border text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/25"
              >
                <option>Once Daily</option>
                <option>Twice Daily</option>
                <option>Three Times Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </div>
          </div>

          {/* 3. Clinical Improvement Rationale */}
          <div>
            <label className="text-[12.5px] font-medium text-foreground/80 mb-1.5 block">
              Doctor's Clinical Note & Disease Improvement Rationale
            </label>
            <textarea
              rows={3}
              value={improvementNote}
              onChange={(e) => setImprovementNote(e.target.value)}
              placeholder="e.g. Blood pressure stabilized to 118/76 mmHg over 3 weeks. Reducing Amlodipine to 5mg daily. Monitor symptoms."
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/25 resize-none"
              required
            />
            <p className="text-[11.5px] text-muted-foreground mt-1">
              This explanation is instantly shared with the patient via notification so they understand their dose reduction.
            </p>
          </div>

          {/* Confirmation summary badge */}
          <div className="p-3 rounded-xl bg-success/10 border border-success/20 flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-success shrink-0 mt-0.5" />
            <div className="text-[12px] text-foreground/90">
              <strong>Clinical Action Summary:</strong> {doctor?.name || "Doctor"} is updating{" "}
              <strong>{medication.name}</strong> from <strong>{medication.dosage}</strong> to{" "}
              <strong>{newDosage}</strong> ({newFrequency}) following <strong>{currentLevel.badge}</strong> for{" "}
              {medication.disease || "patient's condition"}.
            </div>
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
            className="h-10 px-5 rounded-xl bg-success text-success-foreground text-[13px] font-semibold hover:opacity-90 transition inline-flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            {submitting ? "Updating..." : "Save Dosage & Notify Patient"}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
