import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, MOODS } from "@/lib/categories";
import { useAppData } from "@/lib/app-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function AddTransactionDialog({ trigger, defaultKind = "expense" }: { trigger?: React.ReactNode; defaultKind?: "income" | "expense" }) {
  const { addTransaction } = useAppData();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"income" | "expense">(defaultKind);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [merchant, setMerchant] = useState("");
  const [note, setNote] = useState("");
  const [mood, setMood] = useState<string>("necessary");
  const [saving, setSaving] = useState(false);

  const cats = kind === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const num = Number(amount);
    if (!num || num <= 0) return toast.error("Enter a valid amount");
    setSaving(true);
    try {
      await addTransaction({
        kind,
        amount: num,
        category,
        merchant: merchant || null,
        note: note || null,
        mood: kind === "expense" ? mood : null,
        tags: [],
        occurred_at: new Date().toISOString(),
      });
      toast.success(kind === "income" ? "Income added" : "Expense added");
      setOpen(false);
      setAmount("");
      setMerchant("");
      setNote("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-2">
            <Plus className="size-4" /> Add Transaction
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-brand-surface border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Log a transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-white/5 p-1">
            {(["expense", "income"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setKind(k);
                  setCategory(k === "expense" ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]);
                }}
                className={cn(
                  "py-2 rounded-md text-sm capitalize font-medium transition-colors",
                  kind === k ? "bg-white text-black" : "text-muted-foreground hover:text-white",
                )}
              >
                {k}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label>Amount (₹)</Label>
            <Input
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              className="text-2xl font-bold h-14"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {cats.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Merchant</Label>
              <Input value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          {kind === "expense" && (
            <div className="space-y-2">
              <Label>How did it feel?</Label>
              <div className="grid grid-cols-3 gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMood(m.key)}
                    className={cn(
                      "py-2 rounded-md border text-xs flex flex-col items-center gap-0.5 transition-colors",
                      mood === m.key
                        ? "border-brand-accent bg-brand-accent/10 text-white"
                        : "border-white/10 text-muted-foreground hover:text-white",
                    )}
                  >
                    <span className="text-base">{m.emoji}</span>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Note</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
