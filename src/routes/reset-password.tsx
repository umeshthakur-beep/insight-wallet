import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate({ to: "/app" });
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <form onSubmit={submit} className="card-surface p-6 w-full max-w-md space-y-4">
        <h1 className="text-xl font-bold text-white">Set a new password</h1>
        <div className="space-y-1.5">
          <Label>New password</Label>
          <Input type="password" required value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        <Button type="submit" disabled={busy} className="w-full">Update password</Button>
      </form>
    </div>
  );
}
