import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAppData } from "@/lib/app-data";
import { computeSummary } from "@/lib/insights";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { formatINR } from "@/lib/currency";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export const Route = createFileRoute("/app/budgets")({
  component: BudgetsPage,
});

function BudgetsPage() {
  const { budgets, transactions, addBudget, deleteBudget } = useAppData();
  const s = useMemo(() => computeSummary(transactions, budgets), [transactions, budgets]);

  const [cat, setCat] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [amt, setAmt] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(amt);
    if (!n || n <= 0) return toast.error("Enter a valid budget");
    await addBudget({ category: cat, amount: n, period: "monthly" });
    setAmt("");
    toast.success("Budget saved");
  }

  return (
    <div className="p-4 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Budgets</h1>
        <p className="text-sm text-muted-foreground">Set a monthly cap for each category. We'll alert you as you approach it.</p>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        <form onSubmit={save} className="card-surface p-6 space-y-4 lg:col-span-1 h-fit">
          <h3 className="font-semibold text-white">New budget</h3>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Monthly limit (₹)</Label>
            <Input inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="10000" />
          </div>
          <Button type="submit" className="w-full gap-2"><Plus className="size-4" />Save budget</Button>
        </form>

        <div className="lg:col-span-2 space-y-3">
          {budgets.length === 0 && (
            <div className="card-surface p-12 text-center text-muted-foreground">
              No budgets yet. Add one on the left to start tracking.
            </div>
          )}
          {budgets.map((b) => {
            const spent = s.byCategory[b.category] ?? 0;
            const pct = Math.min(100, (spent / b.amount) * 100);
            const over = spent > b.amount;
            const color = over ? "bg-brand-danger" : pct > 75 ? "bg-brand-warning" : "bg-brand-success";
            const status = over ? "Over budget" : pct > 75 ? "Approaching cap" : "On track";
            return (
              <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card-surface p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-white">{b.category}</p>
                    <p className="text-xs text-muted-foreground">{status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white tabular-nums">
                      <span className={over ? "text-brand-danger" : ""}>{formatINR(spent)}</span>
                      <span className="text-muted-foreground"> / {formatINR(b.amount)}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {formatINR(Math.max(0, b.amount - spent))} left
                    </p>
                  </div>
                  <button
                    onClick={async () => { await deleteBudget(b.id); toast.success("Removed"); }}
                    className="ml-4 size-8 grid place-items-center rounded-md text-muted-foreground hover:text-brand-danger hover:bg-white/5"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6 }}
                    className={`h-full ${color}`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
