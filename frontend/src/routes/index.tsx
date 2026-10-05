import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  HeartPulse,
  Menu,
  X,
  ArrowRight,
  Calendar,
  Pill,
  BrainCircuit,
  FileText,
  CalendarDays,
  MessageSquare,
  Cloud,
  Smartphone,
  ChevronRight,
  Shield,
  Clock,
  Sparkles,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RK Health · AI-Powered Healthcare Dashboard" },
      { name: "description", content: "Simplify your health journey. Manage appointments, track medications, generate AI health summaries, and export records — all in one premium platform." },
    ],
  }),
  component: LandingPage,
});

/* ---------- Feature Card Component ---------- */
function FeatureCard({
  icon: Icon,
  title,
  desc,
  color,
}: {
  icon: typeof Calendar;
  title: string;
  desc: string;
  color: string;
}) {
  return (
    <div className="card-surface hover-lift p-6 flex flex-col gap-4 border border-border/80 group">
      <div className={`h-12 w-12 rounded-2xl grid place-items-center shrink-0 ${color}`}>
        <Icon className="h-6 w-6 transition-transform group-hover:scale-110" strokeWidth={2.2} />
      </div>
      <div>
        <h3 className="text-[16.5px] font-semibold tracking-tight leading-none text-foreground">{title}</h3>
        <p className="text-[13.5px] text-muted-foreground mt-2 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      
      {/* 1. Header / Navigation Bar */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/80 backdrop-blur-md py-3 shadow-[0_2px_20px_-10px_rgba(0,0,0,0.05)] border-b border-border/60"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-[oklch(0.55_0.22_295)] grid place-items-center shadow-soft transition-transform group-hover:scale-105">
              <HeartPulse className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-[18px] tracking-tight">RK Health</span>
          </Link>

          {/* Desktop Navigation links */}
          <nav className="hidden md:flex items-center gap-7">
            <a href="#features" className="text-[14px] font-medium text-foreground/80 hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="text-[14px] font-medium text-foreground/80 hover:text-primary transition-colors">How It Works</a>
            <a href="#benefits" className="text-[14px] font-medium text-foreground/80 hover:text-primary transition-colors">Why RK Health</a>
          </nav>

          {/* Action buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggle}
              className="h-10 w-10 grid place-items-center rounded-xl border border-border/80 hover:bg-hover text-foreground/80 hover:text-foreground transition-colors cursor-pointer"
              aria-label="Toggle theme"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <Sun className="h-[18px] w-[18px] text-amber-400" />
              ) : (
                <Moon className="h-[18px] w-[18px] text-foreground/80" />
              )}
            </button>
            <Link
              to="/login"
              className="text-[13.5px] font-semibold text-foreground/90 hover:text-primary hover:bg-hover px-4 py-2 rounded-xl transition"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="text-[13.5px] font-semibold bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] px-4.5 py-2.5 rounded-xl shadow-soft transition-all"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile hamburger & theme toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggle}
              className="h-10 w-10 grid place-items-center rounded-xl border border-border/80 hover:bg-hover text-foreground/80 hover:text-foreground transition-colors cursor-pointer"
              aria-label="Toggle theme"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <Sun className="h-[18px] w-[18px] text-amber-400" />
              ) : (
                <Moon className="h-[18px] w-[18px] text-foreground/80" />
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-10 w-10 rounded-xl hover:bg-hover grid place-items-center text-foreground transition-colors"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-card border-b border-border p-5 space-y-4 shadow-lg animate-fade-in">
            <nav className="flex flex-col gap-3">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-[15px] font-medium py-2 border-b border-border/50 text-foreground/80 hover:text-primary"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="text-[15px] font-medium py-2 border-b border-border/50 text-foreground/80 hover:text-primary"
              >
                How It Works
              </a>
              <a
                href="#benefits"
                onClick={() => setMobileMenuOpen(false)}
                className="text-[15px] font-medium py-2 text-foreground/80 hover:text-primary"
              >
                Why RK Health
              </a>
            </nav>
            <div className="flex flex-col gap-2 pt-2">
              <Link
                to="/login"
                className="w-full text-center py-2.5 rounded-xl border border-border text-[14px] font-medium hover:bg-hover transition"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="w-full text-center py-2.5 rounded-xl bg-primary text-primary-foreground text-[14px] font-semibold hover:opacity-90 transition"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section className="relative py-20 sm:py-28 overflow-hidden px-5 sm:px-8">
        {/* Soft decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[360px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-[1100px] mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 text-[12px] font-bold text-primary tracking-widest uppercase bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full shadow-sm">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" /> AI-Powered Health Assistant
          </div>

          <h1 className="text-[44px] sm:text-[56px] lg:text-[64px] font-extrabold leading-[1.08] tracking-tight text-foreground max-w-4xl mx-auto">
            AI-Powered Healthcare Management
          </h1>

          <p className="text-[17px] sm:text-[19px] text-muted-foreground leading-relaxed max-w-2xl mx-auto font-normal">
            Manage appointments, medications, health records, AI-powered summaries, reminders, and reports—all in one intelligent healthcare platform.
          </p>

          <div className="flex items-center justify-center pt-2">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:opacity-95 font-semibold text-[15.5px] px-8 py-3.5 rounded-2xl shadow-soft transition active:scale-[0.98]"
            >
              Get Started <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          {/* Feature Pillars Filling Space */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5 pt-10 text-left">
            <div className="card-surface p-5 rounded-2xl border border-border/80 flex items-start gap-3.5 hover-lift">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-foreground">Smart Scheduling</div>
                <div className="text-[12.5px] text-muted-foreground mt-0.5 leading-snug">Google Calendar synced appointments</div>
              </div>
            </div>

            <div className="card-surface p-5 rounded-2xl border border-border/80 flex items-start gap-3.5 hover-lift">
              <div className="h-10 w-10 rounded-xl bg-success/10 text-success grid place-items-center shrink-0">
                <Pill className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-foreground">Medication Reminders</div>
                <div className="text-[12.5px] text-muted-foreground mt-0.5 leading-snug">Automated Twilio SMS text alerts</div>
              </div>
            </div>

            <div className="card-surface p-5 rounded-2xl border border-border/80 flex items-start gap-3.5 hover-lift">
              <div className="h-10 w-10 rounded-xl bg-ai/10 text-ai grid place-items-center shrink-0">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-foreground">Groq AI Summaries</div>
                <div className="text-[12.5px] text-muted-foreground mt-0.5 leading-snug">Plain English medical translations</div>
              </div>
            </div>

            <div className="card-surface p-5 rounded-2xl border border-border/80 flex items-start gap-3.5 hover-lift">
              <div className="h-10 w-10 rounded-xl bg-warning/15 text-warning grid place-items-center shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-foreground">Health Reports</div>
                <div className="text-[12.5px] text-muted-foreground mt-0.5 leading-snug">Instant PDF, Excel & CSV exports</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Features Section */}
      <section id="features" className="py-20 sm:py-28 bg-sidebar/55 border-y border-border px-5 sm:px-8">
        <div className="max-w-[1400px] mx-auto space-y-12">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-[12px] font-bold tracking-widest text-primary uppercase bg-primary/10 px-3.5 py-1.5 rounded-full">Features</span>
            <h2 className="text-[32px] sm:text-[38px] font-bold tracking-tight text-foreground">
              Everything You Need in One Place
            </h2>
            <p className="text-[15.5px] text-muted-foreground leading-relaxed">
              Consolidate your healthcare monitoring, medicine prescriptions, and calendar schedule, powered by advanced automated AI insights.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={Calendar}
              title="Appointment Management"
              desc="Book and coordinate medical consultations with your practitioners effortlessly."
              color="bg-primary/10 text-primary"
            />
            <FeatureCard
              icon={Pill}
              title="Medication Reminders"
              desc="Real-time compliance charts tracking your dosages, schedules, and compliance ratios."
              color="bg-success/10 text-success"
            />
            <FeatureCard
              icon={BrainCircuit}
              title="AI Health Summaries"
              desc="Instantly analyze complex medical consultation logs into clear, actionable bullet points."
              color="bg-ai/10 text-ai"
            />
            <FeatureCard
              icon={FileText}
              title="Health Reports"
              desc="Consolidate health compliance metrics and export clean PDFs for medical examinations."
              color="bg-primary/10 text-primary"
            />
            <FeatureCard
              icon={CalendarDays}
              title="Google Calendar Integration"
              desc="Automatically synchronize checkups and clinical tests straight to your Google Calendar."
              color="bg-warning/10 text-[oklch(0.55_0.17_60)]"
            />
            <FeatureCard
              icon={MessageSquare}
              title="SMS Notifications"
              desc="Receive secure text message alerts before medication schedules or doctor visits."
              color="bg-success/10 text-success"
            />
            <FeatureCard
              icon={Cloud}
              title="Cloud-Based Health Records"
              desc="Safely view, edit, and archive clinical records from any terminal."
              color="bg-primary/10 text-primary"
            />
            <FeatureCard
              icon={Smartphone}
              title="Responsive Dashboard"
              desc="Beautiful, fluid interfaces adapted to computer monitors, tablets, and smartphones."
              color="bg-ai/10 text-ai"
            />
          </div>
        </div>
      </section>

      {/* 4. How It Works Section */}
      <section id="how-it-works" className="py-20 sm:py-28 px-5 sm:px-8">
        <div className="max-w-[1400px] mx-auto space-y-16">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-[12px] font-bold tracking-widest text-primary uppercase bg-primary/10 px-3.5 py-1.5 rounded-full">Process</span>
            <h2 className="text-[32px] sm:text-[38px] font-bold tracking-tight text-foreground">
              Simple 4-Step Setup
            </h2>
            <p className="text-[15.5px] text-muted-foreground leading-relaxed">
              Unlock the power of automated healthcare records. Here is how easy it is to start:
            </p>
          </div>

          {/* Timeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            
            {/* Step 1 */}
            <div className="text-center space-y-4 flex flex-col items-center">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary font-bold text-[19px] grid place-items-center shadow-soft border border-primary/20">
                1
              </div>
              <h3 className="text-[17px] font-semibold text-foreground">Create Your Account</h3>
              <p className="text-[13.5px] text-muted-foreground leading-relaxed px-4">
                Register inside our secure portal with your email and basic personal details.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center space-y-4 flex flex-col items-center">
              <div className="h-14 w-14 rounded-2xl bg-success/10 text-success font-bold text-[19px] grid place-items-center shadow-soft border border-success/20">
                2
              </div>
              <h3 className="text-[17px] font-semibold text-foreground">Add Appointments & Meds</h3>
              <p className="text-[13.5px] text-muted-foreground leading-relaxed px-4">
                Input your prescription schedules and upcoming consultation appointments.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center space-y-4 flex flex-col items-center">
              <div className="h-14 w-14 rounded-2xl bg-ai/10 text-ai font-bold text-[19px] grid place-items-center shadow-soft border border-ai/20">
                3
              </div>
              <h3 className="text-[17px] font-semibold text-foreground">Generate AI Summaries</h3>
              <p className="text-[13.5px] text-muted-foreground leading-relaxed px-4">
                Paste doctor logs and compile instantaneous structured summaries.
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center space-y-4 flex flex-col items-center">
              <div className="h-14 w-14 rounded-2xl bg-warning/10 text-[oklch(0.55_0.17_60)] font-bold text-[19px] grid place-items-center shadow-soft border border-warning/20">
                4
              </div>
              <h3 className="text-[17px] font-semibold text-foreground">Track Your Health</h3>
              <p className="text-[13.5px] text-muted-foreground leading-relaxed px-4">
                Monitor compliance metrics and visual trend lines inside the dashboard.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 5. Benefits Section */}
      <section id="benefits" className="py-20 bg-sidebar/55 border-y border-border px-5 sm:px-8">
        <div className="max-w-[1400px] mx-auto space-y-12">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-[12px] font-bold tracking-widest text-primary uppercase bg-primary/10 px-3.5 py-1.5 rounded-full">Benefits</span>
            <h2 className="text-[32px] sm:text-[38px] font-bold tracking-tight text-foreground">
              Built for Modern Patients
            </h2>
          </div>

          {/* Stats cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card-surface p-6 flex flex-col items-center text-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary grid place-items-center"><Cloud className="h-5 w-5" /></div>
              <div className="text-[32px] font-bold tracking-tight leading-none text-primary">100%</div>
              <div className="text-[14px] font-semibold">Cloud Based</div>
              <p className="text-[12.5px] text-muted-foreground">Access your secure patient charts anytime, anywhere, on any terminal.</p>
            </div>
            <div className="card-surface p-6 flex flex-col items-center text-center gap-3">
              <div className="h-10 w-10 rounded-full bg-success/10 text-success grid place-items-center"><Clock className="h-5 w-5" /></div>
              <div className="text-[32px] font-bold tracking-tight leading-none text-success">24/7</div>
              <div className="text-[14px] font-semibold">Access Anywhere</div>
              <p className="text-[12.5px] text-muted-foreground">Never miss a dose or schedule with continuous system background syncing.</p>
            </div>
            <div className="card-surface p-6 flex flex-col items-center text-center gap-3">
              <div className="h-10 w-10 rounded-full bg-ai/10 text-ai grid place-items-center"><BrainCircuit className="h-5 w-5" /></div>
              <div className="text-[32px] font-bold tracking-tight leading-none text-ai">AI Powered</div>
              <div className="text-[14px] font-semibold">Smart Insights</div>
              <p className="text-[12.5px] text-muted-foreground">Transform complex test statistics and records into readable reports.</p>
            </div>
            <div className="card-surface p-6 flex flex-col items-center text-center gap-3">
              <div className="h-10 w-10 rounded-full bg-warning/10 text-[oklch(0.55_0.17_60)] grid place-items-center"><Shield className="h-5 w-5" /></div>
              <div className="text-[32px] font-bold tracking-tight leading-none text-[oklch(0.55_0.17_60)]">Secure</div>
              <div className="text-[14px] font-semibold">Healthcare Data</div>
              <p className="text-[12.5px] text-muted-foreground">Fully protected medical directory hosting with high level credentials.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="bg-background py-8 px-5 sm:px-8 border-t border-border text-center text-[12.5px] text-muted-foreground">
        <p>© 2026 RK Health Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
