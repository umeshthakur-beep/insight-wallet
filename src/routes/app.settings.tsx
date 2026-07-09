import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAppData } from "@/lib/app-data";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { mode, displayName, transactions, signOut } = useAppData();
  const navigate = useNavigate();

  function exportAll() {
    const data = { transactions, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expensemind-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded");
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-white tracking-tight mb-6">Settings</h1>

      <div className="space-y-4">
        <div className="card-surface p-6">
          <h3 className="font-semibold text-white mb-1">Profile</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {mode === "guest" ? "You're browsing as a guest. Data lives on this device only." : "Signed-in account"}
          </p>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
            <div className="size-10 rounded-full bg-brand-accent/20 grid place-items-center text-brand-accent font-semibold">
              {(displayName || "?").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-white font-medium">{displayName || "Guest"}</p>
              <p className="text-xs text-muted-foreground">{mode === "guest" ? "Guest mode" : "Signed in"}</p>
            </div>
          </div>
          {mode === "guest" && (
            <Button onClick={() => navigate({ to: "/auth" })} className="mt-4">Create an account to sync</Button>
          )}
        </div>

        <div className="card-surface p-6">
          <h3 className="font-semibold text-white mb-1">Data & backup</h3>
          <p className="text-sm text-muted-foreground mb-4">Export a JSON snapshot of your transactions.</p>
          <Button variant="secondary" onClick={exportAll}>Download backup</Button>
        </div>

        <div className="card-surface p-6">
          <h3 className="font-semibold text-white mb-1">Session</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {mode === "guest" ? "Exit guest mode to sign in or create an account." : "Sign out of ExpenseMind."}
          </p>
          <Button variant="destructive" onClick={async () => { await signOut(); navigate({ to: "/auth" }); }}>
            {mode === "guest" ? "Exit guest mode" : "Sign out"}
          </Button>
        </div>

        <div className="card-surface p-6">
          <h3 className="font-semibold text-white mb-1">Currency</h3>
          <p className="text-sm text-muted-foreground">Indian Rupee (₹). More currencies coming soon.</p>
        </div>
      </div>
    </div>
  );
}
