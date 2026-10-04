import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { HeartPulse, Check, Mail, Eye, EyeOff, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { authStore } from "@/lib/store";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in · RK Health" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Form Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!email) {
      errs.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = "Enter a valid email address";
    }

    if (!password) {
      errs.password = "Password is required";
    } else if (password.length < 6) {
      errs.password = "Password must be at least 6 characters";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please resolve form validation errors.");
      return;
    }

    setLoading(true);
    try {
      const isValid = await authStore.login(email, password);
      if (!isValid) {
        setLoading(false);
        toast.error("Invalid email or password.");
        return;
      }

      const user = authStore.getCurrentUser();
      setLoading(false);
      setSuccess(true);
      toast.success(`Login Successful! Welcome back, ${user?.name || "User"}`);
      setTimeout(() => {
        // Redirect to dashboard
        navigate({ to: "/dashboard" });
      }, 1200);
    } catch (err: any) {
      setLoading(false);
      toast.error(err.message || "Invalid email or password.");
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

        {/* Welcome Info */}
        <div className="my-auto space-y-8 max-w-md z-10">
          <div className="space-y-3">
            <span className="text-[11px] font-bold tracking-widest uppercase bg-white/15 px-3.5 py-1.5 rounded-full border border-white/10">Welcome Back</span>
            <h2 className="text-[36px] font-bold leading-tight tracking-tight mt-3">
              Your Healthcare Companion.
            </h2>
            <p className="text-[15.5px] text-white/80 leading-relaxed">
              Log in to access your personalized medical record tracker, view upcoming appointments, and explore automated health summaries.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-start gap-3.5">
              <div className="h-6 w-6 rounded-full bg-white/20 grid place-items-center shrink-0 mt-0.5"><Check className="h-3.5 w-3.5" /></div>
              <div>
                <h4 className="text-[14.5px] font-semibold">Consolidated Dashboard</h4>
                <p className="text-[13px] text-white/70">A unified space for medicines, appointments, and doctors.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-[12.5px] text-white/60 flex items-center justify-between border-t border-white/10 pt-6">
          <span>© 2026 RK Health Inc.</span>
        </div>
      </div>

      {/* Right side: Login Form Card */}
      <div className="lg:col-span-7 flex items-center justify-center p-6 bg-background sm:p-12">
        <div className="w-full max-w-md card-surface p-8 sm:p-10 rounded-3xl border border-border bg-card/75 backdrop-blur-md relative">
          
          {success ? (
            <div className="text-center py-12 space-y-5 animate-scale-in">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-success/10 text-success grid place-items-center border border-success/20">
                <CheckCircle2 className="h-8 w-8 animate-pulse" />
              </div>
              <h2 className="text-[24px] font-bold text-foreground">Sign In Successful</h2>
              <p className="text-muted-foreground text-[14px] max-w-xs mx-auto">
                Welcome back. We are preparing your personal health dashboard...
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left mb-8">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary grid place-items-center lg:hidden mb-4">
                  <HeartPulse className="h-6 w-6" strokeWidth={2.5} />
                </div>
                <h1 className="text-[24px] font-bold tracking-tight text-foreground">Welcome Back</h1>
                <p className="text-[13.5px] text-muted-foreground mt-1.5">
                  Login to continue managing your healthcare.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-5">
                {/* Email Address */}
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
                  {errors.password && <p className="text-danger text-[11px] mt-1.5">{errors.password}</p>}
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
                        Sign In <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>

                {/* Switch to Register */}
                <div className="pt-3 text-center text-[13.5px] text-muted-foreground">
                  New to RK Health?{" "}
                  <Link to="/register" className="text-primary hover:underline font-semibold">
                    Create Account
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
