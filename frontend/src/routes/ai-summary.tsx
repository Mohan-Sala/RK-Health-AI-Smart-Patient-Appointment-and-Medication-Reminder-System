import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Topbar } from "@/components/layout/Topbar";
import { PageHeader } from "@/components/ui-kit/PageHeader";
import { BrainCircuit, Copy, RefreshCw, Sparkles, Trash2, User, Stethoscope, Calendar, FileText } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { appointmentsStore, searchStore, authStore, patientStore, doctorStore } from "@/lib/store";

export const Route = createFileRoute("/ai-summary")({
  head: () => ({ meta: [{ title: "AI Consultation Summary · RK Health" }] }),
  component: AiSummaryPage,
});

// Patient-perspective mock sections
const patientMockSections = [
  { title: "Visit Overview", body: "Please select a doctor and click 'Generate Summary' to retrieve AI analysis of your consultation notes." },
  { title: "Medical Explanation", body: "Medical terminology will be automatically translated into plain, easy-to-understand explanations." },
  { title: "Diagnosis Notes", body: "Summary overview and diagnostic findings will display here." },
  { title: "Medication Instructions", body: "Custom dosage and schedule instructions will be generated from your prescribed medications." },
  { title: "Follow-up Advice", body: "Warning signs, review dates, and emergency symptoms will be highlighted." },
  { title: "Recommendations", body: "Personalized diet, exercise, and lifestyle recommendations will appear here." },
];

// Doctor-perspective mock sections
const doctorMockSections = [
  { title: "Clinical Encounter Overview", body: "Please select a patient and click 'Generate Summary' to retrieve physician-grade clinical analysis of this encounter." },
  { title: "Diagnostic Synthesis", body: "Clinical assessment, symptoms, disease trajectory, and therapeutic response notes for physician reference." },
  { title: "Clinical Diagnosis & Status", body: "Overall disease progress evaluation, objective findings, and status synopsis." },
  { title: "Pharmacotherapy Review", body: "Review of active medications, dosage titration suggestions, and clinical precautions." },
  { title: "Clinical Monitoring & Follow-up", body: "Recommended biomarker re-evaluations, diagnostic tests, and scheduled review timelines." },
  { title: "Patient Plan & Recommendations", body: "Prescribed rehabilitative measures, disease-specific dietary plan, and targeted lifestyle modifications." },
];

// Helper to make API calls using the session token
const API_BASE = (import.meta as any).env?.VITE_API_URL
  ? String((import.meta as any).env.VITE_API_URL).replace(/\/$/, "")
  : (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
      ? "/api"
      : "http://localhost:5000/api");

async function apiFetch(path: string, method: "GET" | "POST" | "PUT" | "DELETE" = "GET", body?: any) {
  const token = localStorage.getItem("rk.token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const text = await response.text();
    let msg = "API Request Failed";
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed.error) && parsed.error.length > 0) {
        msg = parsed.error.map((e: any) => e.message || e.field || JSON.stringify(e)).join(", ");
      } else if (typeof parsed.error === "string") {
        msg = parsed.error;
      } else if (parsed.message) {
        msg = parsed.message;
      }
    } catch {
      msg = text || msg;
    }
    throw new Error(msg);
  }
  return response.json();
}

function AiSummaryPage() {
  const appointments = appointmentsStore.use();
  const currentUser = authStore.use();
  const patients = patientStore.use();
  const doctors = doctorStore.use();

  const isDoctor = currentUser?.role === "doctor";

  const [loading, setLoading] = useState(false);
  const [summaries, setSummaries] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
  const [currentSummary, setCurrentSummary] = useState<any>(null);

  const fetchSummaries = async () => {
    try {
      const res = await apiFetch("/ai/summaries");
      if (res.success) {
        setSummaries(res.data);
      }
    } catch {}
  };

  useEffect(() => {
    appointmentsStore.hydrate();
    patientStore.hydrate();
    doctorStore.hydrate();
    fetchSummaries();
  }, []);

  // Filter unique patients (for doctor view)
  const uniquePatients = useMemo(() => {
    const fromAppts = appointments.map((a) => a.patient);
    const fromPatients = patients.map((p) => p.fullName);
    return Array.from(new Set([...fromAppts, ...fromPatients]))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [appointments, patients]);

  // Filter unique doctors (for patient view)
  const uniqueDoctors = useMemo(() => {
    const fromAppts = appointments.map((a) => a.doctor);
    const fromDoctors = doctors.map((d) => d.fullName);
    return Array.from(new Set([...fromAppts, ...fromDoctors]))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [appointments, doctors]);

  // Handle default selection based on user role
  useEffect(() => {
    if (isDoctor) {
      if (uniquePatients.length > 0 && !selectedPatient) {
        setSelectedPatient(uniquePatients[0]);
      }
    } else {
      if (uniqueDoctors.length > 0 && !selectedDoctor) {
        setSelectedDoctor(uniqueDoctors[0]);
      }
    }
  }, [isDoctor, uniquePatients, uniqueDoctors, selectedPatient, selectedDoctor]);

  // Filter appointments matching the selected patient (for doctor) or doctor (for patient)
  const matchedAppointments = useMemo(() => {
    if (isDoctor) {
      if (!selectedPatient) return [];
      return appointments
        .filter((a) => a.patient === selectedPatient)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else {
      if (!selectedDoctor) return [];
      return appointments
        .filter((a) => a.doctor === selectedDoctor)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  }, [isDoctor, selectedPatient, selectedDoctor, appointments]);

  // Sync selected appointment ID
  useEffect(() => {
    if (matchedAppointments.length > 0) {
      if (!matchedAppointments.some((a) => a.id === selectedAppointmentId)) {
        setSelectedAppointmentId(matchedAppointments[0].id);
      }
    } else {
      setSelectedAppointmentId("");
    }
  }, [matchedAppointments, selectedAppointmentId]);

  const activeAppointment = useMemo(() => {
    return matchedAppointments.find((a) => a.id === selectedAppointmentId) || matchedAppointments[0] || null;
  }, [matchedAppointments, selectedAppointmentId]);

  // Sync current summary matching the active appointment ID
  useEffect(() => {
    if (activeAppointment) {
      const match = summaries.find((s) => s.appointmentId === activeAppointment.id);
      setCurrentSummary(match || null);
    } else {
      setCurrentSummary(null);
    }
  }, [activeAppointment, summaries]);

  // Search filter query sync
  const globalQ = searchStore.getQuery();
  useEffect(() => {
    if (globalQ) {
      const qLower = globalQ.toLowerCase();
      if (isDoctor && uniquePatients.length > 0) {
        const match = uniquePatients.find((p) => p.toLowerCase().includes(qLower));
        if (match) setSelectedPatient(match);
      } else if (!isDoctor && uniqueDoctors.length > 0) {
        const match = uniqueDoctors.find((doc) => doc.toLowerCase().includes(qLower));
        if (match) setSelectedDoctor(match);
      }
      searchStore.setQuery("");
    }
  }, [globalQ, isDoctor, uniquePatients, uniqueDoctors]);

  const generate = async () => {
    if (!activeAppointment) {
      toast.error(
        isDoctor
          ? "Please schedule or select an appointment for this patient first."
          : "Please schedule or select an appointment with this doctor first."
      );
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch("/ai/generate-summary", "POST", { appointmentId: activeAppointment.id });
      if (res.success) {
        toast.success(
          isDoctor
            ? `AI Clinical Summary generated for patient ${activeAppointment.patient}!`
            : "AI Consultation Summary generated successfully!"
        );
        await fetchSummaries();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate AI summary.");
    } finally {
      setLoading(false);
    }
  };

  const regenerate = async () => {
    if (!currentSummary) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/ai/summaries/${currentSummary.id}/regenerate`, "PUT");
      if (res.success) {
        toast.success("AI summary regenerated successfully!");
        await fetchSummaries();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to regenerate AI summary.");
    } finally {
      setLoading(false);
    }
  };

  const deleteSummary = async () => {
    if (!currentSummary) return;
    try {
      await apiFetch(`/ai/summaries/${currentSummary.id}`, "DELETE");
      toast.success("AI summary deleted.");
      await fetchSummaries();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete summary.");
    }
  };

  // Sections mapped from current loaded summary
  const displaySections = useMemo(() => {
    if (!currentSummary) return isDoctor ? doctorMockSections : patientMockSections;
    return [
      {
        title: isDoctor ? "Clinical Encounter Overview" : "Visit Overview",
        body: currentSummary.visitOverview,
      },
      {
        title: isDoctor ? "Diagnostic Synthesis" : "Medical Explanation",
        body: currentSummary.medicalExplanation,
      },
      {
        title: isDoctor ? "Clinical Diagnosis & Status" : "Diagnosis Notes",
        body: currentSummary.summary,
      },
      {
        title: isDoctor ? "Pharmacotherapy Review" : "Medication Instructions",
        body: currentSummary.medicationInstructions,
      },
      {
        title: isDoctor ? "Clinical Monitoring & Follow-up" : "Follow-up Advice",
        body: currentSummary.followUpAdvice,
      },
      {
        title: isDoctor ? "Patient Plan & Recommendations" : "Recommendations",
        body: currentSummary.recommendations,
      },
    ];
  }, [currentSummary, isDoctor]);

  const handleCopy = () => {
    if (!currentSummary) {
      toast.error("No summary generated yet.");
      return;
    }
    const headerPrefix = isDoctor
      ? `=== RK Health AI Clinical Summary ===\nPatient: ${activeAppointment?.patient || "Unknown"}\nDoctor: Dr. ${activeAppointment?.doctor || "Attending"}\nDate: ${activeAppointment?.date || "N/A"}\n\n`
      : `=== RK Health AI Consultation Summary ===\nDoctor: Dr. ${activeAppointment?.doctor || "Physician"}\nDate: ${activeAppointment?.date || "N/A"}\n\n`;
    const fullText = headerPrefix + displaySections.map((s) => `[${s.title}]\n${s.body}`).join("\n\n");
    navigator.clipboard.writeText(fullText);
    toast.success("Summary text copied to clipboard!");
  };

  const hasEntities = isDoctor ? uniquePatients.length > 0 : uniqueDoctors.length > 0;

  return (
    <AppLayout>
      <Topbar
        greeting={isDoctor ? "Doctor AI Consultations" : "AI Summary"}
        subtitle={
          isDoctor
            ? "Clinical & patient consultation summaries powered by AI."
            : "Plain-language consultation summaries powered by AI."
        }
      />

      <PageHeader
        title={isDoctor ? "Patient Consultation AI Summary" : "AI Consultation Summary"}
        subtitle={
          isDoctor
            ? "Generate intelligent clinical summaries, diagnostic reviews, and medication monitoring for each patient."
            : "Generate clear, patient-friendly summaries of your medical visits and doctor instructions."
        }
      />

      {/* Selector Control Bar */}
      <div className="card-surface p-5 mb-6">
        {!hasEntities ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
            <div>
              <div className="text-[14px] font-medium text-foreground">
                {isDoctor ? "No patients or consultations found" : "No appointments found"}
              </div>
              <div className="text-[12.5px] text-muted-foreground mt-0.5">
                {isDoctor
                  ? "Schedule or accept patient appointments to generate AI clinical consultation summaries."
                  : "Please schedule a doctor appointment first to generate an AI clinical summary."}
              </div>
            </div>
            <a
              href="/appointments"
              className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium inline-flex items-center gap-1.5 hover:opacity-90 transition shrink-0"
            >
              Schedule Appointment
            </a>
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            {/* Role-specific selector: Patient selector for doctor, Doctor selector for patient */}
            {isDoctor ? (
              <div className="flex-1 min-w-[220px]">
                <label className="text-[12px] font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                  <User className="h-3.5 w-3.5 text-primary" /> Select Patient
                </label>
                <select
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-background border border-border text-[13.5px] font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  {uniquePatients.map((patient) => (
                    <option key={patient} value={patient}>
                      {patient}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex-1 min-w-[220px]">
                <label className="text-[12px] font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                  <Stethoscope className="h-3.5 w-3.5 text-primary" /> Select Doctor
                </label>
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-background border border-border text-[13.5px] font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  {uniqueDoctors.map((doc) => (
                    <option key={doc} value={doc}>
                      {doc}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* If multiple visits exist for the selected patient/doctor, show visit selector */}
            {matchedAppointments.length > 1 && (
              <div className="flex-1 min-w-[220px]">
                <label className="text-[12px] font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" /> Select Visit / Appointment
                </label>
                <select
                  value={selectedAppointmentId}
                  onChange={(e) => setSelectedAppointmentId(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-background border border-border text-[13.5px] font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  {matchedAppointments.map((appt) => (
                    <option key={appt.id} value={appt.id}>
                      {appt.title} · {appt.date} ({appt.visitType})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={currentSummary ? regenerate : generate}
              disabled={loading || !activeAppointment}
              className="h-11 px-5 rounded-xl bg-ai text-ai-foreground text-[13.5px] font-medium inline-flex items-center gap-2 hover:opacity-90 transition disabled:opacity-50 shrink-0 shadow-sm"
            >
              <Sparkles className="h-4 w-4" />
              {loading
                ? "Processing AI..."
                : currentSummary
                ? isDoctor
                  ? "Regenerate Clinical Summary"
                  : "Regenerate Summary"
                : isDoctor
                ? "Generate Patient Summary"
                : "Generate Summary"}
            </button>
          </div>
        )}
      </div>

      {/* Summary Content Card */}
      <div className="card-surface p-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-ai/10 text-ai grid place-items-center shrink-0">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[16px] font-semibold text-foreground">
                {currentSummary
                  ? isDoctor
                    ? "AI Clinical Patient Summary"
                    : "AI Generated Consultation Summary"
                  : isDoctor
                  ? "AI Clinical Summary Template"
                  : "AI Summary Template"}
              </div>
              <div className="text-[12.5px] text-muted-foreground">
                {activeAppointment
                  ? isDoctor
                    ? `Patient: ${activeAppointment.patient} · ${activeAppointment.title} · ${activeAppointment.date}`
                    : `Dr. ${activeAppointment.doctor} · ${activeAppointment.visitType} · ${activeAppointment.date}`
                  : isDoctor
                  ? "No patient appointment selected"
                  : "No doctor appointment selected"}
              </div>
            </div>
          </div>
          {currentSummary && (
            <div className="flex items-center gap-2">
              <ToolBtn icon={Copy} label="Copy Summary" onClick={handleCopy} />
              <ToolBtn icon={RefreshCw} label="Regenerate" onClick={regenerate} />
              <ToolBtn icon={Trash2} label="Delete" onClick={deleteSummary} />
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-4 py-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-40 rounded bg-secondary animate-pulse" />
                <div className="h-3 w-full rounded bg-secondary animate-pulse" />
                <div className="h-3 w-11/12 rounded bg-secondary animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {displaySections.map((s) => (
              <div
                key={s.title}
                className="rounded-2xl border border-border p-5 bg-background shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition hover:border-primary/30"
              >
                <div className="text-[13px] font-semibold text-ai mb-2 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  {s.title}
                </div>
                <p className="text-[13.5px] leading-relaxed text-foreground/85 whitespace-pre-line">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
          <button
            onClick={handleCopy}
            className="h-10 px-4 rounded-xl border border-border text-[13.5px] font-medium inline-flex items-center gap-2 hover:bg-hover transition"
          >
            <Copy className="h-4 w-4" /> Copy to Clipboard
          </button>
          {currentSummary && (
            <button
              onClick={regenerate}
              disabled={loading}
              className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-[13.5px] font-medium inline-flex items-center gap-2 ml-auto hover:opacity-90 transition disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" /> Regenerate Summary
            </button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function ToolBtn({ icon: Icon, label, onClick }: { icon: typeof Copy; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="h-9 w-9 grid place-items-center rounded-lg border border-border hover:bg-hover text-muted-foreground hover:text-foreground transition"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
