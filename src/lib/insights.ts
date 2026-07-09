// Financial insight math shared between the AI coach and dashboard cards.
import type { Transaction, Budget } from "./app-data";

export type Summary = {
  totalIncome: number;
  totalExpense: number;
  net: number;
  monthIncome: number;
  monthExpense: number;
  savings: number;
  savingsRate: number;
  avgDaily: number;
  runwayMonths: number;
  healthScore: number;
  noSpendStreak: number;
  byCategory: Record<string, number>;
  byMood: Record<string, number>;
  weekly: { day: string; amount: number }[];
  discretionary: number;
};

const DISCRETIONARY = new Set(["Food", "Shopping", "Entertainment", "Travel"]);

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function computeSummary(txns: Transaction[], budgets: Budget[]): Summary {
  const now = new Date();
  const monthStart = startOfMonth(now);

  let totalIncome = 0,
    totalExpense = 0,
    monthIncome = 0,
    monthExpense = 0;
  const byCategory: Record<string, number> = {};
  const byMood: Record<string, number> = {};
  let discretionary = 0;

  for (const t of txns) {
    const d = new Date(t.occurred_at);
    if (t.kind === "income") {
      totalIncome += t.amount;
      if (d >= monthStart) monthIncome += t.amount;
    } else {
      totalExpense += t.amount;
      if (d >= monthStart) {
        monthExpense += t.amount;
        byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
        if (DISCRETIONARY.has(t.category)) discretionary += t.amount;
        if (t.mood) byMood[t.mood] = (byMood[t.mood] ?? 0) + t.amount;
      }
    }
  }

  const net = totalIncome - totalExpense;
  const savings = monthIncome - monthExpense;
  const savingsRate = monthIncome > 0 ? savings / monthIncome : 0;
  const daysInMonth = now.getDate();
  const avgDaily = daysInMonth > 0 ? monthExpense / daysInMonth : 0;
  const runwayMonths = monthExpense > 0 ? Math.max(0, net) / monthExpense : 0;

  // Weekly (last 7 days)
  const weekly: { day: string; amount: number }[] = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const label = dayNames[d.getDay()];
    let amt = 0;
    for (const t of txns) {
      if (t.kind !== "expense") continue;
      const td = new Date(t.occurred_at);
      if (
        td.getFullYear() === d.getFullYear() &&
        td.getMonth() === d.getMonth() &&
        td.getDate() === d.getDate()
      )
        amt += t.amount;
    }
    weekly.push({ day: label, amount: Math.round(amt) });
  }

  // No-spend streak (discretionary only)
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const spent = txns.some((t) => {
      if (t.kind !== "expense" || !DISCRETIONARY.has(t.category)) return false;
      const td = new Date(t.occurred_at);
      return (
        td.getFullYear() === d.getFullYear() &&
        td.getMonth() === d.getMonth() &&
        td.getDate() === d.getDate()
      );
    });
    if (spent) break;
    streak++;
  }

  // Health score (0-100)
  let score = 50;
  if (savingsRate > 0.3) score += 25;
  else if (savingsRate > 0.15) score += 15;
  else if (savingsRate > 0) score += 5;
  else score -= 15;

  // Budget adherence
  let over = 0,
    total = 0;
  for (const b of budgets) {
    if (b.period !== "monthly") continue;
    total++;
    if ((byCategory[b.category] ?? 0) > b.amount) over++;
  }
  if (total > 0) score += Math.round(((total - over) / total) * 15);
  else score += 5;

  // Discretionary control
  if (monthExpense > 0) {
    const dRatio = discretionary / monthExpense;
    if (dRatio < 0.25) score += 10;
    else if (dRatio > 0.5) score -= 10;
  }
  score = Math.max(0, Math.min(100, score));

  return {
    totalIncome,
    totalExpense,
    net,
    monthIncome,
    monthExpense,
    savings,
    savingsRate,
    avgDaily,
    runwayMonths,
    healthScore: Math.round(score),
    noSpendStreak: streak,
    byCategory,
    byMood,
    weekly,
    discretionary,
  };
}
