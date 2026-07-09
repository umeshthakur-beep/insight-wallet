import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAppData } from "@/lib/app-data";
import { AddTransactionDialog } from "@/components/app/AddTransactionDialog";
import { formatINR } from "@/lib/currency";
import { CATEGORY_ICON, EXPENSE_CATEGORIES, INCOME_CATEGORIES, MOODS } from "@/lib/categories";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Trash2, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/transactions")({
  component: TransactionsPage,
});

function TransactionsPage() {
  const { transactions, deleteTransaction } = useAppData();
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<"all" | "expense" | "income">("all");
  const [cat, setCat] = useState<string>("all");

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (kind !== "all" && t.kind !== kind) return false;
      if (cat !== "all" && t.category !== cat) return false;
      if (q) {
        const hay = `${t.merchant ?? ""} ${t.category} ${t.note ?? ""} ${t.tags.join(" ")} ${t.amount}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [transactions, q, kind, cat]);

  function exportCSV() {
    const rows = [
      ["Date", "Kind", "Category", "Merchant", "Amount", "Mood", "Note"],
      ...filtered.map((t) => [
        new Date(t.occurred_at).toISOString().slice(0, 10),
        t.kind,
        t.category,
        t.merchant ?? "",
        String(t.amount),
        t.mood ?? "",
        t.note ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported CSV");
  }

  return (
    <div className="p-4 lg:p-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} of {transactions.length} shown</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={exportCSV} className="gap-2">
            <Download className="size-4" /> CSV
          </Button>
          <AddTransactionDialog />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="relative md:col-span-2">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search merchant, note, tag..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select value={kind} onValueChange={(v) => setKind(v as typeof kind)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="expense">Expenses</SelectItem>
              <SelectItem value="income">Income</SelectItem>
            </SelectContent>
          </Select>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {[...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="card-surface overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <p className="text-sm">No transactions match your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((t) => {
              const mood = MOODS.find((m) => m.key === t.mood);
              return (
                <div key={t.id} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors group">
                  <div className="size-10 rounded-lg bg-white/5 grid place-items-center text-lg shrink-0">
                    {CATEGORY_ICON[t.category] ?? "•"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{t.merchant || t.category}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {t.category}
                      {mood && ` • ${mood.emoji} ${mood.label}`}
                      {t.note && ` • ${t.note}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-semibold tabular-nums ${t.kind === "income" ? "text-brand-success" : "text-white"}`}>
                      {t.kind === "income" ? "+" : "-"}{formatINR(t.amount)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(t.occurred_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      await deleteTransaction(t.id);
                      toast.success("Deleted");
                    }}
                    className="size-8 grid place-items-center rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-brand-danger hover:bg-white/5"
                    aria-label="Delete"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
