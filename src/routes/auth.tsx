import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    navigate({ to: "/app" });
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Please enter your name");
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: { display_name: form.name },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (data.session) {
      toast.success("Account created");
      navigate({ to: "/app" });
    } else {
      toast.success("Check your email to confirm your account");
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password reset link sent");
  }

  function handleGuest() {
    localStorage.setItem("expensemind:guest", "1");
    localStorage.setItem("expensemind:name", form.name || "Guest");
    toast.success("Entering guest mode");
    navigate({ to: "/app" });
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{ background: "radial-gradient(60% 50% at 50% 0%, oklch(0.62 0.19 275 / 0.35), transparent 70%)" }}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/app" className="inline-flex items-center gap-2 mb-4">
            <span className="size-9 grid place-items-center rounded-xl bg-brand-accent text-white font-bold shadow-[var(--shadow-glow)]">
              E
            </span>
            <span className="text-lg font-semibold text-white tracking-tight">ExpenseMind AI</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Your privacy-first money coach</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Track spending. See runway. Get AI tips with real numbers.
          </p>
        </div>

        <div className="card-surface p-6 backdrop-blur-xl">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid grid-cols-3 w-full mb-6 bg-white/5">
              <TabsTrigger value="login">Log in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
              <TabsTrigger value="forgot">Forgot</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                <Field label="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? <Loader2 className="size-4 animate-spin" /> : "Log in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                <Field label="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? <Loader2 className="size-4 animate-spin" /> : "Create account"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="forgot">
              <form onSubmit={handleForgot} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  We'll email you a link to set a new password.
                </p>
                <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? <Loader2 className="size-4 animate-spin" /> : "Send reset link"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest">
              <span className="bg-brand-surface px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Button variant="secondary" className="w-full gap-2" onClick={handleGuest}>
            <Sparkles className="size-4" /> Continue as guest
          </Button>
          <p className="text-[11px] text-muted-foreground mt-3 text-center">
            Guest data stays on your device. Sign up later to sync.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, type = "text", value, onChange }: { label: string; type?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} required autoComplete="off" />
    </div>
  );
}
