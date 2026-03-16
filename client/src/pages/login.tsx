import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Globe,
  Eye,
  EyeOff,
  Shield,
  Lock,
  User,
  Monitor,
  Smartphone,
  Wifi,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Building2,
  MapPin,
  Wrench,
  DollarSign,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { loginSchema, type LoginData, type Branch } from "@shared/schema";

const loginModes = [
  { value: "office", label: "Office Mode", icon: Monitor, color: "text-purple-500" },
  { value: "field", label: "Field Mode", icon: MapPin, color: "text-blue-500" },
  { value: "recovery", label: "Recovery Mode", icon: DollarSign, color: "text-orange-500" },
  { value: "technician", label: "Technician Mode", icon: Wrench, color: "text-teal-500" },
  { value: "admin", label: "Admin Mode", icon: ShieldCheck, color: "text-red-500" },
];

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [shakeError, setShakeError] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      loginMode: "office",
      branch: "",
      rememberMe: false,
    },
  });

  useEffect(() => {
    if (lockTimer > 0) {
      const timer = setTimeout(() => setLockTimer(lockTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (lockTimer === 0 && isLocked) {
      setIsLocked(false);
      setFailedAttempts(0);
    }
  }, [lockTimer, isLocked]);

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return res.json();
    },
    onSuccess: () => {
      setFailedAttempts(0);
      onLogin();
    },
    onError: (error: Error) => {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      setShakeError(true);
      setTimeout(() => setShakeError(false), 600);

      if (newAttempts >= 5) {
        setIsLocked(true);
        setLockTimer(60);
        toast({
          title: "Account Locked",
          description: "Too many failed attempts. Please wait 60 seconds.",
          variant: "destructive",
        });
        return;
      }

      const msg = error.message;
      let description = "Invalid username or password";
      if (msg.includes("403")) description = "Account suspended. Contact administrator.";
      else if (msg.includes("401")) description = `Invalid credentials. ${5 - newAttempts} attempts remaining.`;
      else description = "Something went wrong. Please try again.";

      toast({
        title: "Login Failed",
        description,
        variant: "destructive",
      });
    },
  });

  const handleForgotPassword = () => {
    if (!forgotEmail) {
      toast({ title: "Enter your email address", variant: "destructive" });
      return;
    }
    setForgotSent(true);
    toast({
      title: "Reset Link Sent",
      description: "If this email exists in our system, you'll receive a password reset link.",
    });
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{
        background: "linear-gradient(135deg, #002B5B 0%, #004d99 30%, #007BFF 70%, #0099ff 100%)",
      }}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: "#007BFF", top: "10%", left: "20%" }} />
          <div className="absolute w-80 h-80 rounded-full opacity-10 blur-3xl" style={{ background: "#00c6ff", bottom: "15%", right: "15%" }} />
        </div>
        <div className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #002B5B, #007BFF)" }}>
                <Lock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold" data-testid="text-forgot-title">Reset Password</h2>
                <p className="text-sm text-muted-foreground">Enter your registered email</p>
              </div>
            </div>

            {forgotSent ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Check Your Email</h3>
                <p className="text-sm text-muted-foreground mb-6">We've sent a password reset link to your email address.</p>
                <Button onClick={() => { setShowForgotPassword(false); setForgotSent(false); setForgotEmail(""); }} className="w-full" style={{ background: "linear-gradient(135deg, #002B5B, #007BFF)" }} data-testid="button-back-to-login">
                  Back to Login
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Address</Label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="mt-1.5 h-11 rounded-xl"
                    data-testid="input-forgot-email"
                  />
                </div>
                <Button onClick={handleForgotPassword} className="w-full h-11 rounded-xl" style={{ background: "linear-gradient(135deg, #002B5B, #007BFF)" }} data-testid="button-send-reset">
                  Send Reset Link
                </Button>
                <Button variant="ghost" onClick={() => setShowForgotPassword(false)} className="w-full" data-testid="button-back-login">
                  Back to Login
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden" style={{
        background: "linear-gradient(135deg, #002B5B 0%, #004d99 30%, #007BFF 70%, #0099ff 100%)",
      }}>
        <div className="absolute inset-0" style={{
          background: `radial-gradient(circle at 30% 50%, rgba(0,179,255,0.25) 0%, transparent 60%),
                        radial-gradient(circle at 70% 20%, rgba(124,58,237,0.15) 0%, transparent 50%),
                        radial-gradient(circle at 50% 80%, rgba(0,123,255,0.2) 0%, transparent 60%)`
        }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10zm-20 0c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10zm-20 0c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />

        <div className="absolute bottom-0 left-0 right-0 h-40 opacity-20">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M0 60L48 55C96 50 192 40 288 45C384 50 480 70 576 75C672 80 768 70 864 55C960 40 1056 20 1152 15C1248 10 1344 20 1392 25L1440 30V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0V60Z" fill="white" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-4 mb-10">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
              <Globe className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">NetSphere</h1>
              <p className="text-sm font-medium text-blue-200/80 tracking-widest uppercase mt-0.5">Enterprise ISP & HR Management</p>
            </div>
          </div>

          <h2 className="text-5xl font-bold leading-tight mb-5 max-w-lg">
            Secure. <br />
            Structured. <br />
            <span className="bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent">Smart.</span>
          </h2>

          <p className="text-base text-blue-100/70 max-w-lg leading-relaxed mb-12">
            Complete billing, customer management, HR operations, and network monitoring platform with enterprise-grade security.
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-md">
            {[
              { icon: Shield, label: "Role-Based Access" },
              { icon: Building2, label: "Multi-Branch" },
              { icon: Lock, label: "Device Binding" },
              { icon: Wifi, label: "GPS Tracking" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/8 border border-white/10 backdrop-blur-sm">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-4.5 w-4.5 text-blue-200" />
                </div>
                <span className="text-sm font-medium text-blue-100/90">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 flex items-center gap-2 text-blue-200/50 text-xs">
            <Lock className="h-3.5 w-3.5" />
            <span>256-bit SSL Encrypted Connection</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 relative">
        <div className="absolute inset-0 opacity-50" style={{
          backgroundImage: "radial-gradient(circle at 80% 20%, rgba(0,123,255,0.05), transparent 50%), radial-gradient(circle at 20% 80%, rgba(0,43,91,0.03), transparent 50%)"
        }} />

        <div className={`w-full max-w-[440px] relative animate-in fade-in slide-in-from-bottom-4 duration-700 ${shakeError ? "animate-shake" : ""}`}>
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-xl" style={{ background: "linear-gradient(135deg, #002B5B, #007BFF)" }}>
              <Globe className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-login-title">NetSphere</h1>
            <p className="text-sm text-muted-foreground mt-1">Enterprise ISP & HR Management</p>
          </div>

          <div className="hidden lg:block mb-7">
            <h2 className="text-2xl font-bold tracking-tight">Staff Login</h2>
            <p className="text-sm text-muted-foreground mt-1">Sign in to access your dashboard</p>
          </div>

          {isLocked && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 flex items-center gap-3" data-testid="alert-locked">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-400">Account temporarily locked</p>
                <p className="text-xs text-red-600 dark:text-red-500">Try again in {lockTimer} seconds</p>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-7 shadow-xl shadow-slate-200/50 dark:shadow-none">
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-5">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Username / Employee ID</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Enter your username"
                            data-testid="input-username"
                            className="h-11 rounded-xl pl-10"
                            disabled={isLocked}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            data-testid="input-password"
                            className="h-11 rounded-xl pl-10 pr-10"
                            disabled={isLocked}
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="loginMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Login Mode</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "office"} disabled={isLocked}>
                        <FormControl>
                          <SelectTrigger className="h-11 rounded-xl" data-testid="select-login-mode">
                            <SelectValue placeholder="Select login mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loginModes.map(mode => (
                            <SelectItem key={mode.value} value={mode.value}>
                              <div className="flex items-center gap-2">
                                <mode.icon className={`h-4 w-4 ${mode.color}`} />
                                <span>{mode.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="branch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Branch (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""} disabled={isLocked}>
                        <FormControl>
                          <SelectTrigger className="h-11 rounded-xl" data-testid="select-branch">
                            <SelectValue placeholder="Select branch" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">All Branches</SelectItem>
                          <SelectItem value="head_office">Head Office</SelectItem>
                          <SelectItem value="branch_1">Branch 1</SelectItem>
                          <SelectItem value="branch_2">Branch 2</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isLocked}
                              data-testid="checkbox-remember-me"
                            />
                          </FormControl>
                          <Label className="text-sm text-muted-foreground cursor-pointer">Remember me</Label>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium transition-colors"
                          data-testid="button-forgot-password"
                        >
                          Forgot Password?
                        </button>
                      </div>
                    </FormItem>
                  )}
                />

                {failedAttempts > 0 && failedAttempts < 5 && (
                  <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400" data-testid="text-failed-attempts">
                    <AlertCircle className="h-4 w-4" />
                    <span>{5 - failedAttempts} login attempts remaining</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, #002B5B, #007BFF)" }}
                  disabled={loginMutation.isPending || isLocked}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </span>
                  ) : isLocked ? (
                    <span className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Locked ({lockTimer}s)
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </Form>
          </div>

          <div className="mt-5 p-3.5 rounded-xl bg-white/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
            <p className="text-xs text-muted-foreground text-center">
              Demo: <span className="font-semibold text-foreground">admin</span> / <span className="font-semibold text-foreground">admin123</span>
            </p>
          </div>

          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              <span>Secure Login</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <div className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              <span>Encrypted</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <div className="flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5" />
              <span>Device Tracked</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
}