import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Receipt, PiggyBank, Sparkles, Settings, LogOut, Sparkle } from "lucide-react";
import { motion } from "framer-motion";
import { useAppData } from "@/lib/app-data";
import { computeSummary } from "@/lib/insights";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/transactions", label: "Transactions", icon: Receipt },
  { to: "/app/budgets", label: "Budgets", icon: PiggyBank },
  { to: "/app/coach", label: "AI Coach", icon: Sparkles, pro: true },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const { pathname } = useLocation();
  const { transactions, budgets, mode, displayName, signOut } = useAppData();
  const navigate = useNavigate();
  const summary = useMemo(() => computeSummary(transactions, budgets), [transactions, budgets]);

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/auth" });
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 border-r border-white/5 bg-brand-bg/70 backdrop-blur-xl hidden lg:flex flex-col p-6 z-30">
      <Link to="/app" className="flex items-center gap-3 mb-10 px-2">
        <div className="size-8 bg-brand-accent rounded-lg flex items-center justify-center font-bold text-white shadow-[var(--shadow-glow)]">
          E
        </div>
        <span className="font-semibold tracking-tight text-white">ExpenseMind AI</span>
      </Link>

      <nav className="space-y-1">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                active ? "bg-white/5 text-white" : "text-muted-foreground hover:text-white hover:bg-white/5",
              )}
            >
              <item.icon className="size-4" />
              <span className="flex-1">{item.label}</span>
              {item.pro && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-accent/20 text-brand-accent font-bold tracking-wider">
                  PRO
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-gradient-to-br from-brand-accent/15 to-transparent border border-brand-accent/20"
        >
          <p className="text-[10px] font-medium text-brand-accent uppercase tracking-widest mb-2">
            Financial Health
          </p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-white tabular-nums">{summary.healthScore}</span>
            <span className="text-muted-foreground text-xs mb-1">/100</span>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full mt-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${summary.healthScore}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-brand-accent"
            />
          </div>
        </motion.div>

        <div className="flex items-center gap-3 px-2">
          <div className="size-9 rounded-full bg-white/5 border border-white/10 grid place-items-center text-xs font-medium text-white">
            {(displayName || "?").slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{displayName}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              {mode === "guest" ? (
                <>
                  <Sparkle className="size-2.5" /> Guest mode
                </>
              ) : (
                "Signed in"
              )}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="size-8 grid place-items-center rounded-md text-muted-foreground hover:text-white hover:bg-white/5"
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const { pathname } = useLocation();
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-white/5 bg-brand-bg/90 backdrop-blur-xl">
      <div className="grid grid-cols-5">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2.5 text-[10px]",
                active ? "text-brand-accent" : "text-muted-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
