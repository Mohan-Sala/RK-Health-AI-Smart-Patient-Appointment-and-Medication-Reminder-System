import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Topbar } from "@/components/layout/Topbar";
import { PageHeader } from "@/components/ui-kit/PageHeader";
import { Bell, Calendar, BrainCircuit, Lock, Palette, Settings as SettingsIcon, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "@/components/theme-provider";
import { toast } from "sonner";
import {
  authStore,
  settingsStore,
  appointmentsStore,
  medicationsStore,
  patientStore,
  formatToE164Phone,
} from "@/lib/store";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · RK Health" }] }),
  component: SettingsPage,
});

const tabs = [
  { id: "general", label: "General", icon: SettingsIcon },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "sms", label: "Reminders (SMS)", icon: MessageSquare },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "ai", label: "AI Configuration", icon: BrainCircuit },
  { id: "privacy", label: "Privacy & Security", icon: Lock },
  { id: "appearance", label: "Appearance", icon: Palette },
];

function SettingsPage() {
  const user = authStore.use();
  const [tab, setTab] = useState("general");
  const { theme, setTheme } = useTheme();
  const [phone, setPhone] = useState(user?.phone || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.phone) {
      setPhone(user.phone);
    }
  }, [user?.phone]);

  const handleSavePhone = async () => {
    try {
      setIsSaving(true);
      const formatted = formatToE164Phone(phone);
      if (!formatted) {
        toast.error("Please enter a valid phone number");
        return;
      }
      await authStore.updateProfile({ phone: formatted });
      await settingsStore.update({ phone: formatted });
      await Promise.all([
        appointmentsStore.hydrate(),
        medicationsStore.hydrate(),
        patientStore.hydrate(),
      ]);
      setPhone(formatted);
      toast.success(`Mobile number updated to ${formatted} across all appointments, medications & reminders!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update mobile number");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout>
      <Topbar greeting="Settings" subtitle="Configure your RK Health experience." />

      <PageHeader title="Settings" subtitle="Personalize the way RK Health works for you." />

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <aside className="card-surface p-3 h-fit">
          <nav className="space-y-1">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] transition ${tab===t.id ? "bg-primary/10 text-primary font-medium" : "text-foreground/80 hover:bg-hover"}`}>
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="card-surface p-6">
          {tab === "general" && (
            <Form title="General Settings" isSaving={isSaving} onSave={handleSavePhone}>
              <Field label="Mobile Phone Number">
                <div>
                  <input
                    type="tel"
                    className="h-10 px-3 rounded-xl bg-background border border-border w-full max-w-sm text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 90142 41234"
                  />
                  <p className="text-[12px] text-muted-foreground mt-1">
                    Synchronized across your profile, appointments, and medication SMS alerts.
                  </p>
                </div>
              </Field>
              <Field label="Theme">
                <div className="inline-flex rounded-xl border border-border bg-background p-1">
                  <button onClick={() => setTheme("light")} className={`h-9 px-4 rounded-lg text-[13px] ${theme==="light" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Light</button>
                  <button onClick={() => setTheme("dark")} className={`h-9 px-4 rounded-lg text-[13px] ${theme==="dark" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Dark</button>
                </div>
              </Field>
              <Field label="Language"><Select options={["English","Hindi","Spanish"]} /></Field>
              <Field label="Date Format"><Select options={["May 24, 2025","24/05/2025","2025-05-24"]} /></Field>
              <Field label="Time Format"><Select options={["12 Hour (AM/PM)","24 Hour"]} /></Field>
              <Field label="Timezone"><Select options={["Asia/Kolkata (IST)","UTC","America/New_York"]} /></Field>
              <Field label="Default View"><Select options={["Dashboard","Appointments","Medications"]} /></Field>
            </Form>
          )}
          {tab === "notifications" && (
            <Form title="Notifications" onSave={() => toast.success("Preferences saved")}>
              <Toggle label="SMS Notifications" defaultChecked />
              <Toggle label="Appointment Notifications" defaultChecked />
              <Toggle label="Medication Reminders" defaultChecked />
              <Toggle label="Email Notifications" />
              <Toggle label="Push Notifications" defaultChecked />
            </Form>
          )}
          {tab === "sms" && (
            <Form title="SMS Reminders (Twilio Gateway)" isSaving={isSaving} onSave={handleSavePhone}>
              <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-[12.5px] text-foreground">
                <div className="font-semibold text-primary mb-0.5">Twilio SMS Gateway Active</div>
                <div>Automated cron checks dispatch medication & appointment alerts to your phone. Outbound number: <strong>+1 (775) 330-7773</strong>.</div>
              </div>
              <Field label="Recipient Phone Number">
                <div>
                  <input
                    type="tel"
                    className="h-10 px-3 rounded-xl bg-background border border-border w-full text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 90142 41234"
                  />
                  <p className="text-[12px] text-muted-foreground mt-1">
                    Updates your contact number across your entire account, appointments, and medication reminders.
                  </p>
                </div>
              </Field>
              <Field label="Reminder Lead Time"><Select options={["10 minutes","30 minutes","1 hour"]} /></Field>
              <Toggle label="Send daily summary at 8 AM" defaultChecked />
              <Toggle label="Automated scheduled medication SMS alerts" defaultChecked />
            </Form>
          )}
          {tab === "calendar" && (
            <Form title="Calendar (Google Calendar Integration)" onSave={() => toast.success("Calendar settings saved")}>
              <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-[12.5px] text-foreground">
                <div className="font-semibold text-primary mb-0.5">Google Calendar Sync Active</div>
                <div>Appointments automatically synchronize with reminders. You can also click <strong>Add to Google Calendar</strong> on any appointment card.</div>
              </div>
              <Toggle label="Google Calendar Sync" defaultChecked />
              <Field label="Default Reminder Time"><Select options={["15 min before","30 min before","1 hour before"]} /></Field>
              <Field label="Week Starts"><Select options={["Monday","Sunday"]} /></Field>
              <div className="pt-2">
                <a
                  href="https://calendar.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 px-4 rounded-xl border border-border text-[13px] font-medium inline-flex items-center gap-2 hover:bg-hover transition text-foreground"
                >
                  <Calendar className="h-4 w-4 text-primary" /> Open Google Calendar
                </a>
              </div>
            </Form>
          )}
          {tab === "ai" && (
            <Form title="AI Configuration" onSave={() => toast.success("AI preferences saved")}>
              <Field label="Summary Length"><Select options={["Concise","Standard","Detailed"]} /></Field>
              <Toggle label="Include layman's explanation" defaultChecked />
              <Toggle label="Include medication schedule" defaultChecked />
            </Form>
          )}
          {tab === "privacy" && (
            <Form title="Privacy & Security" onSave={() => toast.success("Updated")}>
              <button className="h-10 px-4 rounded-xl border border-border text-[13.5px]">Change Password</button>
              <Toggle label="Two-factor authentication" />
              <Toggle label="Allow analytics" defaultChecked />
            </Form>
          )}
          {tab === "appearance" && (
            <Form title="Appearance" onSave={() => toast.success("Appearance updated")}>
              <Field label="Theme">
                <div className="grid grid-cols-3 gap-3">
                  {["light","dark","system"].map((t) => (
                    <button key={t} onClick={() => t !== "system" && setTheme(t as "light" | "dark")} className={`h-20 rounded-xl border-2 capitalize text-[13px] font-medium ${(theme===t || (t==="system" && false)) ? "border-primary bg-primary/5" : "border-border bg-background"}`}>{t}</button>
                  ))}
                </div>
              </Field>
            </Form>
          )}
        </section>
      </div>
    </AppLayout>
  );
}

function Form({
  title,
  children,
  onSave,
  isSaving,
}: {
  title: string;
  children: React.ReactNode;
  onSave: () => any;
  isSaving?: boolean;
}) {
  return (
    <div>
      <h2 className="text-[18px] font-semibold mb-5">{title}</h2>
      <div className="space-y-5">{children}</div>
      <div className="mt-7 flex items-center gap-3">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-[13.5px] font-medium disabled:opacity-50 transition"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
        <button className="h-10 px-5 rounded-xl border border-border text-[13.5px]">Reset</button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-3 items-center">
      <label className="text-[13.5px] text-muted-foreground">{label}</label>
      <div>{children}</div>
    </div>
  );
}

function Select({ options }: { options: string[] }) {
  return (
    <select className="h-10 px-3 rounded-xl bg-background border border-border text-[13.5px] w-full max-w-sm">
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  );
}

function Toggle({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  const [on, setOn] = useState(!!defaultChecked);
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-background">
      <span className="text-[13.5px]">{label}</span>
      <button onClick={() => setOn(!on)} className={`relative h-6 w-11 rounded-full transition ${on ? "bg-primary" : "bg-muted"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${on ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}
