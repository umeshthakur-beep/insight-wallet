import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Radar, Lightbulb, LineChart, RefreshCw } from "lucide-react";
import { useAppData } from "@/lib/app-data";
import { computeSummary } from "@/lib/insights";
import { formatINR } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { getCoachInsights, type CoachResponse } from "@/lib/ai-coach.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/app/coach")({
  component: CoachPage,
});

function CoachPage() {
  const { transactions, budgets } = useAppData();
  const s = useMemo(() => computeSummary(transactions, budgets), [transactions, budgets]);
  const [insights, setInsights] = useState<CoachResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const fn = useServerFn(getCoachInsights);

  async function generate() {
    setLoading(true);
    try {
      const r = await fn({
        data: {
          summary: {
            monthIncome: s.monthIncome,
            monthExpense: s.monthExpense,
            savings: s.savings,
            savingsRate: s.savingsRate,
            avgDaily: s.avgDaily,
            runwayMonths: s.runwayMonths,
            healthScore: s.healthScore,
            noSpendStreak: s.noSpendStreak,
            discretionary: s.discretionary,
            byCategory: s.byCategory,
            byMood: s.byMood,
          },
          currency: "INR",
        },
      });
      setInsights(r);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Coach unavailable");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 lg:p-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-mono text-brand-accent uppercase tracking-widest mb-1">AI Coach</p>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Your money, decoded</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Runway forecast, spending X-ray, and tips with real rupee impact.
          </p>
        </div>
        <Button onClick={generate} disabled={loading} className="gap-2">
          {loading ? <RefreshCw className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {insights ? "Regenerate insights" : "Generate insights"}
        </Button>
      </header>

      {/* Snapshot cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Snap label="Health Score" value={`${s.healthScore}/100`} />
        <Snap label="Runway" value={`${s.runwayMonths.toFixed(1)} mo`} />
        <Snap label="Savings rate" value={`${(s.savingsRate * 100).toFixed(0)}%`} />
        <Snap label="Discretionary" value={formatINR(s.discretionary)} />
      </div>

      {!insights && !loading && (
        <div className="card-surface p-10 text-center max-w-2xl mx-auto">
          <Sparkles className="size-8 text-brand-accent mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-white mb-2">Ready when you are</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Tap "Generate insights" and the AI Coach will read your last month, spot leaks, and give you a
            personalized runway forecast, spending X-ray, three tips with rupee impact, and one investment move.
          </p>
          <Button onClick={generate} className="gap-2"><Sparkles className="size-4" /> Generate insights</Button>
        </div>
      )}

      {loading && !insights && (
        <div className="card-surface p-16 text-center">
          <RefreshCw className="size-6 text-brand-accent mx-auto mb-3 animate-spin" />
          <p className="text-sm text-muted-foreground">Reading your last 30 days…</p>
        </div>
      )}

      {insights && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Headline + Runway */}
          <div className="p-8 rounded-2xl bg-gradient-to-br from-brand-accent/20 via-brand-surface to-brand-surface border border-brand-accent/30 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 size-72 rounded-full border-[12px] border-white/5" />
            <div className="relative">
              <p className="text-xs font-bold tracking-widest text-brand-accent uppercase mb-3">Headline</p>
              <h2 className="text-2xl lg:text-3xl font-bold text-white leading-tight max-w-3xl">
                {insights.headline}
              </h2>
              <div className="mt-6 flex items-start gap-3 text-slate-200">
                <TrendingUp className="size-5 text-brand-success shrink-0 mt-0.5" />
                <p className="text-base">{insights.runway}</p>
              </div>
            </div>
          </div>

          {/* Spending X-Ray */}
          <section className="card-surface p-6">
            <div className="flex items-center gap-2 mb-4">
              <Radar className="size-4 text-brand-warning" />
              <h3 className="font-semibold text-white">Spending X-Ray</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              {insights.xray.map((x, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="p-4 rounded-xl bg-white/5 border border-white/5"
                >
                  <span className="text-[10px] font-mono text-brand-warning">{String(i + 1).padStart(2, "0")}</span>
                  <p className="text-sm text-slate-200 mt-2">{x}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Tips */}
          <section className="card-surface p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="size-4 text-brand-accent" />
              <h3 className="font-semibold text-white">AI Tips — with numbers</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              {insights.tips.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="p-5 rounded-xl bg-gradient-to-br from-brand-accent/10 to-transparent border border-brand-accent/20"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-brand-accent uppercase tracking-widest">
                      Tip {i + 1}
                    </span>
                    <span className="text-xs font-mono text-brand-success">
                      +{formatINR(t.impact)}/mo
                    </span>
                  </div>
                  <h4 className="font-semibold text-white mb-1">{t.title}</h4>
                  <p className="text-xs text-muted-foreground">{t.detail}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Investment */}
          <section className="p-6 rounded-2xl bg-gradient-to-br from-brand-success/15 to-brand-surface border border-brand-success/25">
            <div className="flex items-center gap-2 mb-3">
              <LineChart className="size-4 text-brand-success" />
              <h3 className="font-semibold text-white">Investment Suggestion</h3>
            </div>
            <p className="text-base text-slate-100 leading-relaxed max-w-3xl">{insights.investment}</p>
            <p className="text-[11px] text-muted-foreground mt-3">
              Not financial advice. Consider consulting a SEBI-registered advisor before acting.
            </p>
          </section>
        </motion.div>
      )}
    </div>
  );
}

function Snap({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-surface p-4">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-xl font-bold text-white tabular-nums mt-1">{value}</p>
    </div>
  );
}
