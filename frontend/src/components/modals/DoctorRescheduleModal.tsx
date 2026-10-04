import { useState, useEffect } from "react";
import { Modal, ModalFooter } from "./Modal";
import { type Appointment } from "@/lib/store";
import { CalendarClock, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onReschedule: (id: string, date: string, time: string, reason: string) => Promise<void>;
};

const AVAILABILITY_SLOTS = [
  { period: "Morning Slots", slots: ["09:00", "09:30", "10:15", "11:00", "11:45"] },
  { period: "Afternoon Slots", slots: ["14:00", "14:30", "15:15", "16:00", "16:45"] },
  { period: "Evening Slots", slots: ["17:30", "18:15", "19:00"] },
];

const PRESET_REASONS = [
  "Doctor availability updated for this date",
  "Emergency clinical consultation / surgery",
  "Slot adjusted to accommodate extended patient review",
  "Patient follow-up schedule optimized",
  "Routine clinic hours realignment",
];

export function DoctorRescheduleModal({ open, onClose, appointment, onReschedule }: Props) {
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [reason, setReason] = useState(PRESET_REASONS[0]);
  const [customNote, setCustomNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (appointment && open) {
      setNewDate(appointment.date || new Date().toISOString().slice(0, 10));
      setNewTime(appointment.time || "09:30");
      setReason(PRESET_REASONS[0]);
      setCustomNote("");
    }
  }, [appointment, open]);

  if (!appointment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) {
      toast.error("Please pick a rescheduled appointment date.");
      return;
    }
    if (!newTime) {
      toast.error("Please pick an available time slot.");
      return;
    }

    setSubmitting(true);
    try {
      const fullReason = customNote ? `${reason} — ${customNote}` : reason;
      await onReschedule(appointment.id, newDate, newTime, fullReason);
      toast.success(`Appointment rescheduled to ${newDate} at ${newTime}. Notification dispatched to patient.`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to reschedule appointment.");
    } finally {
      setSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <Modal open={open} onClose={onClose} title="Reschedule Appointment">
      <form onSubmit={handleSubmit}>
        <div className="px-6 py-5 space-y-5">
          {/* Current Appointment Banner */}
          <div className="p-4 rounded-2xl bg-secondary/50 border border-border flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0 mt-0.5">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold text-foreground truncate">{appointment.title}</div>
              <div className="text-[12.5px] text-muted-foreground mt-0.5">
                Patient: <span className="font-medium text-foreground">{appointment.patient}</span> · Currently: {appointment.date} at {appointment.time}
              </div>
            </div>
          </div>

          {/* New Date Picker */}
          <div>
            <label className="text-[12.5px] font-medium text-foreground/80 mb-1.5 block">Select New Date</label>
            <input
              type="date"
              min={todayStr}
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-background border border-border text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/25"
              required
            />
          </div>

          {/* Doctor Available Time Slots */}
          <div>
            <label className="text-[12.5px] font-medium text-foreground/80 mb-2 flex items-center justify-between">
              <span>Doctor Available Time Slots</span>
              <span className="text-[11.5px] text-muted-foreground">Selected: {newTime || "None"}</span>
            </label>
            <div className="space-y-3">
              {AVAILABILITY_SLOTS.map((group) => (
                <div key={group.period} className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{group.period}</div>
                  <div className="flex flex-wrap gap-2">
                    {group.slots.map((slot) => {
                      const isSelected = newTime === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setNewTime(slot)}
                          className={`h-9 px-3 rounded-xl text-[12.5px] font-medium border transition flex items-center gap-1.5 ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-background border-border text-foreground hover:bg-hover hover:border-primary/40"
                          }`}
                        >
                          <Clock className="h-3.5 w-3.5 opacity-70" />
                          <span>{slot}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rescheduling Reason */}
          <div>
            <label className="text-[12.5px] font-medium text-foreground/80 mb-1.5 block">Reason for Rescheduling</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-background border border-border text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/25"
            >
              {PRESET_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Additional note for patient */}
          <div>
            <label className="text-[12.5px] font-medium text-foreground/80 mb-1.5 block">Message / Clinical Note for Patient (Optional)</label>
            <textarea
              rows={2}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="e.g. Please bring recent fasting blood reports to this consultation."
              className="w-full p-3 rounded-xl bg-background border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
          </div>
        </div>

        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-xl border border-border text-[13.5px] hover:bg-hover transition"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !newDate || !newTime}
            className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-[13.5px] font-medium hover:opacity-90 transition disabled:opacity-50 inline-flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{submitting ? "Rescheduling..." : "Confirm Reschedule"}</span>
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
