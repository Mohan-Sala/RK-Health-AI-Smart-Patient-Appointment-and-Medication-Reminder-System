import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { HeartPulse, Check, User, Mail, Phone, Calendar, Eye, EyeOff, Lock, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { authStore } from "@/lib/store";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create Your Account · RK Health" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Role & Doctor Fields
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [specialization, setSpecialization] = useState("General Medicine");
  const [hospital, setHospital] = useState("");

  // Password Visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Password Strength State
  const [strength, setStrength] = useState(0);
  const [strengthText, setStrengthText] = useState("");
  const [strengthColor, setStrengthColor] = useState("bg-muted");

  // Calculate Password Strength
  useEffect(() => {
    if (!password) {
      setStrength(0);
      setStrengthText("");
      setStrengthColor("bg-muted");
      return;
    }

    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    setStrength(score);
    if (score === 1) {
      setStrengthText("Weak");
      setStrengthColor("bg-danger");
    } else if (score === 2) {
      setStrengthText("Fair");
      setStrengthColor("bg-warning");
    } else if (score === 3) {
      setStrengthText("Good");
      setStrengthColor("bg-primary");
    } else if (score === 4) {
      setStrengthText("Strong");
      setStrengthColor("bg-success");
    }
  }, [password]);

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!name.trim()) errs.name = "Full Name is required";
    
    if (!email) {
      errs.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = "Enter a valid email address";
    }

    if (!phone) {
      errs.phone = "Phone number is required";
    } else if (!/^\+?[0-9\s-]{10,14}$/.test(phone)) {
      errs.phone = "Enter a valid phone number (min 10 digits)";
    }

    if (!dob) errs.dob = "Date of birth is required";
    if (!gender) errs.gender = "Gender is required";

    if (!password) {
      errs.password = "Password is required";
    } else if (password.length < 8) {
      errs.password = "Password must be at least 8 characters";
    }

    if (password !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please resolve the errors in the form.");
      return;
    }

    setLoading(true);
    try {
      await authStore.register({
        name,
        email,
        phone,
        dob,
        gender,
        password,
        avatar: "",
        role,
        specialization: role === "doctor" ? specialization : undefined,
        hospital: role === "doctor" ? hospital : undefined,
      });

      // clear the form
      setName("");
      setEmail("");
      setPhone("");
      setDob("");
      setGender("");
      setPassword("");
      setConfirmPassword("");

      setLoading(false);
      setSuccess(true);
      toast.success("Account created successfully!");
      setTimeout(() => {
        navigate({ to: "/login" });
      }, 1500);
    } catch (err: any) {
      setLoading(false);
      toast.error(err.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background font-sans select-none overflow-x-hidden">
      {/* Left side: Premium Gradient Splash (hidden on mobile) */}
      <div className="lg:col-span-5 hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-primary via-[oklch(0.55_0.22_295)] to-ai text-white relative overflow-hidden">
        {/* Decorative backdrop shapes */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] aspect-square rounded-full bg-white/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] aspect-square rounded-full bg-ai-foreground/10 blur-[120px]" />

        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 w-fit hover:opacity-90 transition">
          <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-md grid place-items-center border border-white/20 shadow-soft">
            <HeartPulse className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-[19px] tracking-tight">RK Health</span>
        </Link>

        {/* Feature Highlights on Left Side */}
        <div className="my-auto space-y-8 max-w-md z-10">
          <div className="space-y-3">
            <span className="text-[11px] font-bold tracking-widest uppercase bg-white/15 px-3.5 py-1.5 rounded-full border border-white/10">SaaS Platform</span>
            <h2 className="text-[36px] font-bold leading-tight tracking-tight mt-3">
              Start Managing Your Health Smarter.
            </h2>
            <p className="text-[15.5px] text-white/80 leading-relaxed">
              Join thousands of patients managing appointments, prescriptions, and secure health data in one intuitive portal.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-start gap-3.5">
              <div className="h-6 w-6 rounded-full bg-white/20 grid place-items-center shrink-0 mt-0.5"><Check className="h-3.5 w-3.5" /></div>
              <div>
                <h4 className="text-[14.5px] font-semibold">100% Secure & Compliant</h4>
                <p className="text-[13px] text-white/70">Industry-leading encryption standards for patient record security.</p>
              </div>
            </div>
            <div className="flex items-start gap-3.5">
              <div className="h-6 w-6 rounded-full bg-white/20 grid place-items-center shrink-0 mt-0.5"><Check className="h-3.5 w-3.5" /></div>
              <div>
                <h4 className="text-[14.5px] font-semibold">Real-Time Synchronization</h4>
                <p className="text-[13px] text-white/70">Connect with doctors, appointments, and medication compliance charts.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-[12.5px] text-white/60 flex items-center justify-between border-t border-white/10 pt-6">
          <span>© 2026 RK Health Inc.</span>
        </div>
      </div>

      {/* Right side: Registration Form Card */}
      <div className="lg:col-span-7 flex items-center justify-center p-6 bg-background sm:p-12 overflow-y-auto">
        <div className="w-full max-w-xl card-surface p-8 sm:p-10 rounded-3xl border border-border bg-card/75 backdrop-blur-md relative">
          
          {success ? (
            <div className="text-center py-12 space-y-5 animate-scale-in">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-success/10 text-success grid place-items-center border border-success/20">
                <CheckCircle2 className="h-8 w-8 animate-pulse" />
              </div>
              <h2 className="text-[24px] font-bold text-foreground">Registration Successful!</h2>
              <p className="text-muted-foreground text-[14px] max-w-xs mx-auto">
                Your account is ready. Redirecting you to the sign-in page to continue...
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left mb-8">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary grid place-items-center lg:hidden mb-4">
                  <HeartPulse className="h-6 w-6" strokeWidth={2.5} />
                </div>
                <h1 className="text-[24px] font-bold tracking-tight text-foreground">Create Your RK Health Account</h1>
                <p className="text-[13.5px] text-muted-foreground mt-1.5">
                  Join RK Health and start managing your healthcare intelligently.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleRegister} className="space-y-5">
                {/* Account Type Selector */}
                <div>
                  <label className="text-[12.5px] font-medium text-foreground/80 mb-2 block">I am creating an account as</label>
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <button
                      type="button"
                      onClick={() => setRole("patient")}
                      className={`p-3.5 rounded-2xl border text-left transition flex flex-col gap-1.5 ${
                        role === "patient"
                          ? "border-primary bg-primary/10 text-primary font-medium shadow-sm"
                          : "border-border bg-background hover:bg-hover text-foreground/80"
                      }`}
                    >
                      <div className="text-[20px]">🧑</div>
                      <div className="text-[13.5px] font-semibold">Patient</div>
                      <div className="text-[11.5px] text-muted-foreground">Track health, medications & visits</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("doctor")}
                      className={`p-3.5 rounded-2xl border text-left transition flex flex-col gap-1.5 ${
                        role === "doctor"
                          ? "border-primary bg-primary/10 text-primary font-medium shadow-sm"
                          : "border-border bg-background hover:bg-hover text-foreground/80"
                      }`}
                    >
                      <div className="text-[20px]">👨‍⚕️</div>
                      <div className="text-[13.5px] font-semibold">Doctor / Physician</div>
                      <div className="text-[11.5px] text-muted-foreground">Manage visits, prescribe & titrate</div>
                    </button>
                  </div>
                </div>

                {role === "doctor" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-secondary/30 border border-border animate-fade-in">
                    <div>
                      <label className="text-[12px] font-medium text-foreground/80 mb-1.5 block">Medical Specialization</label>
                      <select
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-background border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/25"
                      >
                        <option>General Medicine</option>
                        <option>Cardiology</option>
                        <option>Endocrinology</option>
                        <option>Neurology</option>
                        <option>Pediatrics</option>
                        <option>Pulmonology</option>
                        <option>Dermatology</option>
                        <option>Orthopedics</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-foreground/80 mb-1.5 block">Hospital / Clinic</label>
                      <input
                        type="text"
                        placeholder="e.g. Apollo Hospital"
                        value={hospital}
                        onChange={(e) => setHospital(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-background border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/25"
                      />
                    </div>
                  </div>
                )}

                {/* Full Name */}
                <div>
                  <label className="text-[12.5px] font-medium text-foreground/80 mb-1.5 block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full h-11 pl-10 pr-3 rounded-xl bg-background border ${
                        errors.name ? "border-danger focus:ring-danger/25" : "border-border focus:ring-primary/25"
                      } text-[13.5px] focus:outline-none focus:ring-4 transition-all`}
                    />
                  </div>
                  {errors.name && <p className="text-danger text-[11px] mt-1.5">{errors.name}</p>}
                </div>

                {/* Email & Phone grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div>
                    <label className="text-[12.5px] font-medium text-foreground/80 mb-1.5 block">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full h-11 pl-10 pr-3 rounded-xl bg-background border ${
                          errors.email ? "border-danger focus:ring-danger/25" : "border-border focus:ring-primary/25"
                        } text-[13.5px] focus:outline-none focus:ring-4 transition-all`}
                      />
                    </div>
                    {errors.email && <p className="text-danger text-[11px] mt-1.5">{errors.email}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-[12.5px] font-medium text-foreground/80 mb-1.5 block">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={`w-full h-11 pl-10 pr-3 rounded-xl bg-background border ${
                          errors.phone ? "border-danger focus:ring-danger/25" : "border-border focus:ring-primary/25"
                        } text-[13.5px] focus:outline-none focus:ring-4 transition-all`}
                      />
                    </div>
                    {errors.phone && <p className="text-danger text-[11px] mt-1.5">{errors.phone}</p>}
                  </div>
                </div>

                {/* DOB & Gender grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* DOB */}
                  <div>
                    <label className="text-[12.5px] font-medium text-foreground/80 mb-1.5 block">Date of Birth</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className={`w-full h-11 pl-10 pr-3 rounded-xl bg-background border ${
                          errors.dob ? "border-danger focus:ring-danger/25" : "border-border focus:ring-primary/25"
                        } text-[13.5px] focus:outline-none focus:ring-4 transition-all`}
                      />
                    </div>
                    {errors.dob && <p className="text-danger text-[11px] mt-1.5">{errors.dob}</p>}
                  </div>

                  {/* Gender select */}
                  <div>
                    <label className="text-[12.5px] font-medium text-foreground/80 mb-1.5 block">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className={`w-full h-11 px-3.5 rounded-xl bg-background border ${
                        errors.gender ? "border-danger focus:ring-danger/25" : "border-border focus:ring-primary/25"
                      } text-[13.5px] focus:outline-none focus:ring-4 transition-all`}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.gender && <p className="text-danger text-[11px] mt-1.5">{errors.gender}</p>}
                  </div>
                </div>

                {/* Password Fields */}
                <div className="space-y-4 pt-1">
                  {/* Password */}
                  <div>
                    <label className="text-[12.5px] font-medium text-foreground/80 mb-1.5 block">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full h-11 pl-10 pr-10 rounded-xl bg-background border ${
                          errors.password ? "border-danger focus:ring-danger/25" : "border-border focus:ring-primary/25"
                        } text-[13.5px] focus:outline-none focus:ring-4 transition-all`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {password && (
                      <div className="mt-2.5 space-y-1 animate-fade-in">
                        <div className="flex justify-between items-center text-[11px] font-medium">
                          <span className="text-muted-foreground">Password strength:</span>
                          <span className={
                            strength === 1 ? "text-danger" :
                            strength === 2 ? "text-warning" :
                            strength === 3 ? "text-primary" :
                            "text-success"
                          }>{strengthText}</span>
                        </div>
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden flex gap-0.5">
                          <div className={`h-full rounded-full transition-all duration-300 ${strength >= 1 ? strengthColor : "bg-transparent"} flex-1`} />
                          <div className={`h-full rounded-full transition-all duration-300 ${strength >= 2 ? strengthColor : "bg-transparent"} flex-1`} />
                          <div className={`h-full rounded-full transition-all duration-300 ${strength >= 3 ? strengthColor : "bg-transparent"} flex-1`} />
                          <div className={`h-full rounded-full transition-all duration-300 ${strength >= 4 ? strengthColor : "bg-transparent"} flex-1`} />
                        </div>
                      </div>
                    )}
                    {errors.password && <p className="text-danger text-[11px] mt-1.5">{errors.password}</p>}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="text-[12.5px] font-medium text-foreground/80 mb-1.5 block">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full h-11 pl-10 pr-10 rounded-xl bg-background border ${
                          errors.confirmPassword ? "border-danger focus:ring-danger/25" : "border-border focus:ring-primary/25"
                        } text-[13.5px] focus:outline-none focus:ring-4 transition-all`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-danger text-[11px] mt-1.5">{errors.confirmPassword}</p>}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-[14px] font-semibold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        Create Account <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>

                {/* Switch to Login */}
                <div className="pt-3 text-center text-[13.5px] text-muted-foreground">
                  Already have an RK Health account?{" "}
                  <Link to="/login" className="text-primary hover:underline font-semibold">
                    Sign In
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
