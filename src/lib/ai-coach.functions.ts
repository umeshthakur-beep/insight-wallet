import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callLovableAI } from "./ai-gateway.server";

const CoachInput = z.object({
  summary: z.object({
    monthIncome: z.number(),
    monthExpense: z.number(),
    savings: z.number(),
    savingsRate: z.number(),
    avgDaily: z.number(),
    runwayMonths: z.number(),
    healthScore: z.number(),
    noSpendStreak: z.number(),
    discretionary: z.number(),
    byCategory: z.record(z.string(), z.number()),
    byMood: z.record(z.string(), z.number()),
  }),
  currency: z.string().default("INR"),
});

export type CoachResponse = {
  headline: string;
  runway: string;
  xray: string[];
  tips: { title: string; detail: string; impact: number }[];
  investment: string;
};

function fmtINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function fallback(input: z.infer<typeof CoachInput>): CoachResponse {
  const s = input.summary;
  const topCat =
    Object.entries(s.byCategory).sort((a, b) => b[1] - a[1])[0] ?? ["Food", 0];
  const topMood =
    Object.entries(s.byMood).sort((a, b) => b[1] - a[1])[0] ?? ["necessary", 0];
  return {
    headline: `Health score ${s.healthScore}/100 — savings ${Math.round(s.savingsRate * 100)}% of income.`,
    runway: `At ${fmtINR(s.monthExpense)}/mo burn, your savings run for ${s.runwayMonths.toFixed(1)} months.`,
    xray: [
      `Top category: ${topCat[0]} at ${fmtINR(topCat[1])}.`,
      `Most spending felt "${topMood[0]}" — ${fmtINR(topMood[1])} this month.`,
      `Discretionary share: ${fmtINR(s.discretionary)}.`,
    ],
    tips: [
      { title: `Trim ${topCat[0]} by 15%`, detail: `Would free up ${fmtINR(topCat[1] * 0.15)} monthly.`, impact: Math.round(topCat[1] * 0.15) },
      { title: "Automate savings", detail: `Move ${fmtINR(Math.max(0, s.savings) * 0.5)} to a separate account on payday.`, impact: Math.round(Math.max(0, s.savings) * 0.5) },
      { title: "Cap impulsive spend", detail: `Set a weekly limit of ${fmtINR((s.discretionary || 4000) / 4)} for treats.`, impact: 1500 },
    ],
    investment: s.savings > 0
      ? `Route ${fmtINR(s.savings * 0.6)} into a Nifty 50 index fund SIP and keep ${fmtINR(s.savings * 0.4)} as liquid buffer.`
      : "Grow your emergency fund to 3 months of expenses before adding market exposure.",
  };
}

export const getCoachInsights = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CoachInput.parse(d))
  .handler(async ({ data }): Promise<CoachResponse> => {
    const s = data.summary;
    const prompt = `You are a candid personal finance coach for an Indian user. Respond ONLY with strict JSON, no prose.
User summary (INR):
- Monthly income: ${s.monthIncome}
- Monthly expense: ${s.monthExpense}
- Savings this month: ${s.savings}
- Savings rate: ${(s.savingsRate * 100).toFixed(1)}%
- Avg daily spend: ${s.avgDaily.toFixed(0)}
- Runway (months): ${s.runwayMonths.toFixed(1)}
- Health score (0-100): ${s.healthScore}
- No-spend streak (days): ${s.noSpendStreak}
- Discretionary spend: ${s.discretionary}
- Spend by category: ${JSON.stringify(s.byCategory)}
- Spend by mood: ${JSON.stringify(s.byMood)}

Return JSON with this shape:
{
  "headline": "one punchy sentence about their money right now",
  "runway": "one sentence with concrete rupee numbers about how long savings last",
  "xray": ["3 short bullets, each with a specific rupee number, spotting hidden or leaky spend"],
  "tips": [{ "title": "short title", "detail": "one sentence with a rupee number", "impact": monthly_savings_in_rupees_number }],
  "investment": "one specific investment suggestion with rupee amount, appropriate to Indian context (Nifty 50 index fund, liquid fund, PPF, ELSS)"
}
Rules: use rupee symbol ₹ inside strings, keep everything under 25 words per string, provide EXACTLY 3 tips, no markdown.`;

    try {
      const raw = await callLovableAI({
        messages: [
          { role: "system", content: "You output only valid JSON matching the requested schema. No commentary." },
          { role: "user", content: prompt },
        ],
        jsonMode: true,
      });
      const parsed = JSON.parse(raw) as CoachResponse;
      if (!parsed.tips || !Array.isArray(parsed.tips)) throw new Error("bad shape");
      return parsed;
    } catch (err) {
      console.error("Coach AI failed, using fallback", err);
      return fallback(data);
    }
  });
