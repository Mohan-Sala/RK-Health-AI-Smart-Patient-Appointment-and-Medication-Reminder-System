import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Topbar } from "@/components/layout/Topbar";
import { PageHeader } from "@/components/ui-kit/PageHeader";
import { Camera, Pencil, Mail, Phone, Calendar, MapPin, HeartPulse, Stethoscope, Building2, Clock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  authStore,
  profileStore,
  appointmentsStore,
  medicationsStore,
  patientStore,
  reportsStore,
  aiSummaryStore,
} from "@/lib/store";
import { ProfileModal } from "@/components/modals/ProfileModal";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile · RK Health" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const user = authStore.use();
  const appointments = appointmentsStore.use();
  const medications = medicationsStore.use();
  const reports = reportsStore.use();
  const aiSummaries = aiSummaryStore.use();
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    void profileStore.hydrate();
    void appointmentsStore.hydrate();
    void medicationsStore.hydrate();
    void reportsStore.hydrate();
    void aiSummaryStore.hydrate();
  }, []);

  const handleSave = async (data: {
    name: string;
    email: string;
    phone: string;
    dob: string;
    gender: string;
    avatar: string;
    bloodGroup: string;
    height: string;
    weight: string;
    bmi: string;
    allergies: string;
    medicalConditions: string;
    insurance: string;
    lifestyle: string;
    specialization?: string;
    hospital?: string;
    availability?: string;
  }) => {
    try {
      await authStore.updateProfile({
        name: data.name,
        email: data.email,
        phone: data.phone,
        dob: data.dob,
        gender: data.gender,
        avatar: data.avatar,
        bloodGroup: data.bloodGroup || null,
        height: data.height || null,
        weight: data.weight || null,
        bmi: data.bmi || null,
        allergies: data.allergies || null,
        medicalConditions: data.medicalConditions || null,
        insurance: data.insurance || null,
        lifestyle: data.lifestyle || null,
        specialization: data.specialization || null,
        hospital: data.hospital || null,
        availability: data.availability || null,
      });
      toast.success("Profile updated successfully");
      await profileStore.hydrate();
      await Promise.all([
        appointmentsStore.hydrate(),
        medicationsStore.hydrate(),
        patientStore.hydrate(),
        reportsStore.hydrate(),
        aiSummaryStore.hydrate(),
      ]);
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
      throw err;
    }
  };

  const formatValue = (value?: string | null, fallback = "Not Provided") => {
    if (!value || !String(value).trim()) return fallback;
    return value;
  };

  return (
    <AppLayout>
      <Topbar greeting="Profile" subtitle="Your personal & health information." />

      <PageHeader
        title="Profile"
        subtitle="Manage your account, health profile and contacts."
        actions={
          <button
            onClick={() => setEditOpen(true)}
            className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-[13.5px] font-medium inline-flex items-center gap-2 hover:opacity-90 transition"
          >
            <Pencil className="h-4 w-4" /> Edit Profile
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card-surface p-6 text-center">
          <div className="relative inline-block">
            <img
              src={user?.avatar || "/images/default-avatar.png"}
              alt={user?.name || "User"}
              className="h-28 w-28 rounded-full object-cover ring-4 ring-card"
            />
            <button
              onClick={() => setEditOpen(true)}
              className="absolute bottom-1 right-1 h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-soft"
              aria-label="Edit Profile"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 text-[18px] font-semibold">{user?.name || "User"}</div>
          {user?.role === "doctor" ? (
            <div className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
              <Stethoscope className="h-3 w-3" /> Doctor · {user?.specialization || "General Medicine"}
            </div>
          ) : (
            <div className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-medium px-2 py-0.5 rounded-full bg-secondary text-foreground">
              Patient Account
            </div>
          )}
          <div className="text-[13px] text-muted-foreground mt-1">{user?.email || "Not Provided"}</div>
          <div className="text-[13px] text-muted-foreground">{user?.phone || "Not Provided"}</div>

          <div className="mt-6 grid grid-cols-2 gap-3 text-left">
            <Mini label="Appointments" val={String(appointments.length)} />
            <Mini label="Medications" val={String(medications.length)} />
            <Mini label="Reports" val={String(reports.length)} />
            <Mini label="AI Summaries" val={String(aiSummaries.length)} />
          </div>
        </div>

        <div className="card-surface p-6 lg:col-span-2">
          <SectionTitle>Personal & Contact Information</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Info icon={Mail} label="Email" val={formatValue(user?.email)} />
            <Info icon={Phone} label="Phone" val={formatValue(user?.phone)} />
            <Info
              icon={Calendar}
              label="Date of Birth"
              val={user?.dob ? new Date(user.dob).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Not Provided"}
            />
            <Info icon={MapPin} label="Address" val="Bengaluru, India" />
            <Info label="Gender" val={formatValue(user?.gender)} />
            <Info label="Account Role" val={user?.role === "doctor" ? "Physician / Doctor" : "Patient"} />
          </div>

          <div className="my-6 h-px bg-border" />

          {user?.role === "doctor" ? (
            <>
              <SectionTitle>Clinical Practice & Hospital Affiliation</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Info icon={Stethoscope} label="Medical Specialization" val={formatValue(user?.specialization, "General Medicine & Cardiology")} />
                <Info icon={Building2} label="Hospital / Affiliated Clinic" val={formatValue(user?.hospital, "RK Memorial Healthcare Center")} />
                <Info icon={Clock} label="OPD Consultation Hours" val={formatValue(user?.availability, "09:00 AM - 05:30 PM (Mon-Sat)")} />
                <Info icon={ShieldCheck} label="Practicing Designation" val="Attending Physician / Doctor" />
              </div>

              <div className="mt-6 rounded-2xl p-5 bg-linear-to-br from-primary/10 to-ai/10 border border-border flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-card grid place-items-center"><Stethoscope className="h-6 w-6 text-primary" /></div>
                <div className="flex-1">
                  <div className="text-[14px] font-semibold">Doctor Clinical Profile Verified</div>
                  <div className="text-[12.5px] text-muted-foreground">Authorized to prescribe medications, manage consultations, and titrate dosages based on patient clinical improvement.</div>
                </div>
              </div>
            </>
          ) : (
            <>
              <SectionTitle>Health Information</SectionTitle>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Info label="Blood Group" val={formatValue(user?.bloodGroup)} />
                <Info label="Height" val={user?.height ? `${user.height} cm` : "Not Provided"} />
                <Info label="Weight" val={user?.weight ? `${user.weight} kg` : "Not Provided"} />
                <Info label="BMI" val={formatValue(user?.bmi)} />
                <Info label="Allergies" val={formatValue(user?.allergies)} />
                <Info label="Medical Conditions" val={formatValue(user?.medicalConditions)} />
                <Info label="Insurance" val={formatValue(user?.insurance)} />
                <Info label="Lifestyle" val={formatValue(user?.lifestyle)} />
              </div>

              <div className="mt-6 rounded-2xl p-5 bg-linear-to-br from-primary/10 to-ai/10 border border-border flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-card grid place-items-center"><HeartPulse className="h-6 w-6 text-primary" /></div>
                <div className="flex-1">
                  <div className="text-[14px] font-semibold">{user?.bmi ? `BMI ${user.bmi}` : "BMI Not Provided"}</div>
                  <div className="text-[12.5px] text-muted-foreground">Keep your profile details up to date for better care tracking.</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <ProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        user={user}
        onSave={handleSave}
      />
    </AppLayout>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[15px] font-semibold mb-4">{children}</h3>;
}

function Info({ icon: Icon, label, val }: { icon?: typeof Mail; label: string; val: string }) {
  return (
    <div className="rounded-xl border border-border p-3 bg-background">
      <div className="text-[11.5px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3" />} {label}
      </div>
      <div className="text-[13.5px] font-medium mt-1">{val || "Not Provided"}</div>
    </div>
  );
}

function Mini({ label, val }: { label: string; val: string }) {
  return (
    <div className="rounded-xl border border-border p-3 bg-background">
      <div className="text-[11.5px] text-muted-foreground">{label}</div>
      <div className="text-[18px] font-semibold leading-none mt-1">{val}</div>
    </div>
  );
}
