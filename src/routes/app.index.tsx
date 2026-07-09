import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { useAppData } from "@/lib/app-data";
import { computeSummary } from "@/lib/insights";
import { formatINR } from "@/lib/currency";
import { AddTransactionDialog } from "@/components/app/AddTransactionDialog";
import { CATEGORY_ICON, MOODS } from "@/lib/categories";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { ArrowUpRight, TrendingUp, Flame, Sparkles, Wallet, Calendar } from "lucide-react";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

const PIE_COLORS = ["#6366f1", "#f43f5e", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

function Dashboard() {
  const { transactions, budgets, bills, displayName } = useAppData();
  const s = useMemo(() => computeSummary(transactions, budgets), [transactions, budgets]);

  const upcoming = useMemo(() => {
    const today = new Date();
    return bills
      .map((b) => {
        const due = new Date(b.due_date);
        const days = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return { ...b, days };
      })
      .filter((b) => b.days >= -1 && b.days <= 14)
      .sort((a, b) => a.days - b.days)
      .slice(0, 4);
  }, [bills]);

  const catData = useMemo(
    () =>
      Object.entries(s.byCategory)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6),
    [s.byCategory],
  );

  const recent = transactions.slice(0, 6);

  return (
    <div className="p-4 lg:p-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-mono text-brand-accent uppercase tracking-widest mb-1">
            {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </p>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
            {greeting()}, {displayName?.split(" ")[0] || "there"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {upcoming.length > 0
              ? `You have ${upcoming.length} upcoming ${upcoming.length === 1 ? "bill" : "bills"} this week.`
              : "You're all clear on bills this week."}
          </p>
        </div>
        <AddTransactionDialog />
      </header>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Metric label="Total Balance" value={formatINR(s.net)} accent="text-white" hint={`${(s.savingsRate * 100).toFixed(0)}% saved this month`} icon={Wallet} delay={0} />
        <Metric label="Monthly Income" value={formatINR(s.monthIncome)} accent="text-white" hint="All sources" icon={ArrowUpRight} delay={0.05} />
        <Metric label="Monthly Spending" value={formatINR(s.monthExpense)} accent="text-brand-danger" hint={`Avg ${formatINR(s.avgDaily)}/day`} icon={TrendingUp} delay={0.1} />
        <Metric label="No-Spend Streak" value={`${s.noSpendStreak}d`} accent="text-brand-warning" hint={s.noSpendStreak >= 3 ? "You're on a roll" : "Skip one treat"} icon={Flame} delay={0.15} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* AI Coach preview */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-brand-accent/20 to-brand-surface border border-brand-accent/30 relative overflow-hidden"
          >
            <div className="absolute -top-16 -right-16 size-56 rounded-full border-[10px] border-white/5" />
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="size-4 text-brand-accent" />
              <span className="text-xs font-bold tracking-widest text-brand-accent uppercase">AI Coach</span>
              <span className="px-2 py-0.5 rounded-full bg-brand-accent/20 text-[10px] text-brand-accent font-bold">PRO</span>
              <Link to="/app/coach" className="ml-auto text-xs text-brand-accent hover:underline">
                Open full coach →
              </Link>
            </div>
            <div className="grid md:grid-cols-2 gap-6 relative">
              <div>
                <h4 className="text-white font-semibold mb-2">Runway Forecast</h4>
                <p className="text-sm text-slate-300">
                  At {formatINR(s.monthExpense)}/mo burn, your savings would last{" "}
                  <span className="text-white font-bold">{s.runwayMonths.toFixed(1)} months</span> without new income.
                </p>
              </div>
              <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Spending X-Ray</p>
                <p className="text-sm text-slate-200">
                  {topXray(s)}
                </p>
              </div>
            </div>
          </motion.section>

          {/* Weekly bar chart */}
          <section className="card-surface p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-white">Weekly Spending</h3>
              <span className="text-xs text-muted-foreground">Last 7 days</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={s.weekly} margin={{ left: -20, right: 0 }}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "oklch(0.7 0.02 260)", fontSize: 11 }} />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    contentStyle={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                    labelStyle={{ color: "#fff" }}
                    formatter={(v: number) => [formatINR(v), "Spent"]}
                  />
                  <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Recent transactions */}
          <section className="card-surface overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-semibold text-white">Recent Transactions</h3>
              <Link to="/app/transactions" className="text-xs text-brand-accent">View all</Link>
            </div>
            <div className="divide-y divide-white/5">
              {recent.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No transactions yet. Add your first one to see insights.
                </div>
              )}
              {recent.map((t) => {
                const mood = MOODS.find((m) => m.key === t.mood);
                return (
                  <div key={t.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-lg bg-white/5 grid place-items-center text-lg">
                        {CATEGORY_ICON[t.category] ?? "•"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{t.merchant || t.category}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          {t.category}
                          {mood && <span>• {mood.emoji} {mood.label}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold tabular-nums ${t.kind === "income" ? "text-brand-success" : "text-white"}`}>
                        {t.kind === "income" ? "+" : "-"}{formatINR(t.amount)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(t.occurred_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {/* Category pie */}
          <section className="card-surface p-6">
            <h3 className="font-semibold text-white mb-2">By Category</h3>
            <p className="text-xs text-muted-foreground mb-4">This month</p>
            {catData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No spending yet.</p>
            ) : (
              <>
                <div className="h-40">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={catData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
                        {catData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                        formatter={(v: number) => formatINR(v)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 mt-2">
                  {catData.slice(0, 4).map((c, i) => (
                    <div key={c.name} className="flex items-center gap-2 text-xs">
                      <span className="size-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-muted-foreground flex-1">{c.name}</span>
                      <span className="text-white tabular-nums">{formatINR(c.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Budgets progress */}
          <section className="card-surface p-6">
            <h3 className="font-semibold text-white mb-4">Budgets</h3>
            {budgets.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-3">No budgets set.</p>
                <Link to="/app/budgets" className="text-xs text-brand-accent hover:underline">Set your first →</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {budgets.slice(0, 4).map((b) => {
                  const spent = s.byCategory[b.category] ?? 0;
                  const pct = Math.min(100, (spent / b.amount) * 100);
                  const color = pct > 100 ? "bg-brand-danger" : pct > 75 ? "bg-brand-warning" : "bg-brand-success";
                  return (
                    <div key={b.id}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">{b.category}</span>
                        <span className="text-white tabular-nums">
                          {formatINR(spent)} / {formatINR(b.amount)}
                        </span>
                      </div>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6 }}
                          className={`h-full ${color}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Upcoming bills */}
          <section className="card-surface p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="size-4 text-muted-foreground" />
              <h3 className="font-semibold text-white">Upcoming Bills</h3>
            </div>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">Nothing due this week.</p>
            ) : (
              <div className="space-y-3">
                {upcoming.map((b) => (
                  <div key={b.id} className="flex items-center gap-3">
                    <div className={`w-1 h-8 rounded-full ${b.days <= 2 ? "bg-brand-danger" : b.days <= 5 ? "bg-brand-warning" : "bg-brand-accent"}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{b.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {b.days === 0 ? "Today" : b.days === 1 ? "Tomorrow" : `In ${b.days} days`}
                      </p>
                    </div>
                    <span className="text-sm font-mono text-white">{formatINR(b.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  accent,
  icon: Icon,
  delay,
}: {
  label: string;
  value: string;
  hint: string;
  accent: string;
  icon: React.ComponentType<{ className?: string }>;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="p-5 card-surface hover:border-white/10 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-muted-foreground text-sm">{label}</p>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <h3 className={`text-2xl font-bold tabular-nums ${accent}`}>{value}</h3>
      <p className="text-[10px] text-muted-foreground mt-3 uppercase tracking-wider">{hint}</p>
    </motion.div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function topXray(s: ReturnType<typeof computeSummary>): string {
  const topCat = Object.entries(s.byCategory).sort((a, b) => b[1] - a[1])[0];
  if (!topCat) return "Log a few expenses and the coach will point out patterns.";
  return `Your biggest category is ${topCat[0]} at ${formatINR(topCat[1])} — ${((topCat[1] / Math.max(1, s.monthExpense)) * 100).toFixed(0)}% of this month.`;
}
