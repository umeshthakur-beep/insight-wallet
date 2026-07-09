import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type TxnKind = "income" | "expense";

export type Transaction = {
  id: string;
  kind: TxnKind;
  amount: number;
  category: string;
  merchant: string | null;
  note: string | null;
  mood: string | null;
  tags: string[];
  occurred_at: string;
};

export type Budget = { id: string; category: string; amount: number; period: "monthly" | "weekly" };
export type Bill = { id: string; name: string; amount: number; due_date: string; recurring: boolean };

export type AppMode = "loading" | "guest" | "auth" | "signed-out";

const GUEST_KEY = "expensemind:guest";
const LS_TXN = "expensemind:txns";
const LS_BUD = "expensemind:budgets";
const LS_BILL = "expensemind:bills";
const LS_NAME = "expensemind:name";

function loadLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function saveLS<T>(key: string, val: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(val));
}

function seedGuest(): { txns: Transaction[]; budgets: Budget[]; bills: Bill[] } {
  const now = new Date();
  const day = (d: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - d).toISOString();
  const uid = () => Math.random().toString(36).slice(2, 10);
  const txns: Transaction[] = [
    { id: uid(), kind: "income", amount: 120000, category: "Salary", merchant: "Acme Corp", note: null, mood: "investment", tags: [], occurred_at: day(2) },
    { id: uid(), kind: "expense", amount: 42000, category: "Rent", merchant: "Landlord", note: null, mood: "necessary", tags: [], occurred_at: day(1) },
    { id: uid(), kind: "expense", amount: 320, category: "Food", merchant: "Blue Tokai", note: "Morning coffee", mood: "reward", tags: ["coffee"], occurred_at: day(1) },
    { id: uid(), kind: "expense", amount: 4200, category: "Shopping", merchant: "Amazon", note: null, mood: "regret", tags: [], occurred_at: day(3) },
    { id: uid(), kind: "expense", amount: 899, category: "Entertainment", merchant: "Netflix", note: null, mood: "necessary", tags: ["subscription"], occurred_at: day(5) },
    { id: uid(), kind: "expense", amount: 1450, category: "Food", merchant: "Zomato", note: null, mood: "impulsive", tags: [], occurred_at: day(7) },
    { id: uid(), kind: "expense", amount: 2500, category: "Travel", merchant: "Uber", note: null, mood: "necessary", tags: [], occurred_at: day(9) },
    { id: uid(), kind: "expense", amount: 25000, category: "Investment", merchant: "Zerodha", note: "SIP", mood: "investment", tags: [], occurred_at: day(11) },
  ];
  const budgets: Budget[] = [
    { id: uid(), category: "Food", amount: 8000, period: "monthly" },
    { id: uid(), category: "Shopping", amount: 5000, period: "monthly" },
    { id: uid(), category: "Entertainment", amount: 3000, period: "monthly" },
  ];
  const bills: Bill[] = [
    { id: uid(), name: "Rent", amount: 42000, due_date: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10), recurring: true },
    { id: uid(), name: "Reliance Jio", amount: 1249, due_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 6).toISOString().slice(0, 10), recurring: true },
  ];
  return { txns, budgets, bills };
}

type Ctx = {
  mode: AppMode;
  displayName: string;
  transactions: Transaction[];
  budgets: Budget[];
  bills: Bill[];
  loading: boolean;
  addTransaction: (t: Omit<Transaction, "id">) => Promise<void>;
  updateTransaction: (id: string, patch: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addBudget: (b: Omit<Budget, "id">) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  addBill: (b: Omit<Bill, "id">) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  signOut: () => Promise<void>;
  enterGuest: () => void;
};

const AppDataCtx = createContext<Ctx | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>("loading");
  const [displayName, setDisplayName] = useState("");
  const [transactions, setTxns] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Init: detect mode
  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setMode("auth");
        setUserId(data.session.user.id);
      } else if (localStorage.getItem(GUEST_KEY) === "1") {
        setMode("guest");
      } else {
        setMode("signed-out");
        setLoading(false);
      }
    })();
    const sub = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        localStorage.removeItem(GUEST_KEY);
        setMode("auth");
        setUserId(session?.user.id ?? null);
      } else if (event === "SIGNED_OUT") {
        setMode("signed-out");
        setUserId(null);
        setTxns([]);
        setBudgets([]);
        setBills([]);
      }
    });
    unsub = () => sub.data.subscription.unsubscribe();
    return () => unsub?.();
  }, []);

  // Load data when mode/userId changes
  useEffect(() => {
    if (mode === "loading" || mode === "signed-out") return;
    setLoading(true);
    (async () => {
      if (mode === "guest") {
        const name = localStorage.getItem(LS_NAME) || "Guest";
        setDisplayName(name);
        let t = loadLS<Transaction[] | null>(LS_TXN, null);
        let b = loadLS<Budget[] | null>(LS_BUD, null);
        let bl = loadLS<Bill[] | null>(LS_BILL, null);
        if (!t || !b || !bl) {
          const seed = seedGuest();
          t = t ?? seed.txns;
          b = b ?? seed.budgets;
          bl = bl ?? seed.bills;
          saveLS(LS_TXN, t);
          saveLS(LS_BUD, b);
          saveLS(LS_BILL, bl);
        }
        setTxns(t);
        setBudgets(b);
        setBills(bl);
        setLoading(false);
        return;
      }
      if (mode === "auth" && userId) {
        const [{ data: prof }, { data: tx }, { data: bg }, { data: bl }] = await Promise.all([
          supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
          supabase.from("transactions").select("*").order("occurred_at", { ascending: false }).limit(500),
          supabase.from("budgets").select("*"),
          supabase.from("bills").select("*").order("due_date", { ascending: true }),
        ]);
        setDisplayName(prof?.display_name || "there");
        setTxns(
          (tx ?? []).map((r) => ({
            id: r.id,
            kind: r.kind as TxnKind,
            amount: Number(r.amount),
            category: r.category,
            merchant: r.merchant,
            note: r.note,
            mood: r.mood,
            tags: r.tags ?? [],
            occurred_at: r.occurred_at,
          })),
        );
        setBudgets(
          (bg ?? []).map((r) => ({
            id: r.id,
            category: r.category,
            amount: Number(r.amount),
            period: r.period as "monthly" | "weekly",
          })),
        );
        setBills(
          (bl ?? []).map((r) => ({
            id: r.id,
            name: r.name,
            amount: Number(r.amount),
            due_date: r.due_date,
            recurring: r.recurring,
          })),
        );
        setLoading(false);
      }
    })();
  }, [mode, userId]);

  const enterGuest = useCallback(() => {
    localStorage.setItem(GUEST_KEY, "1");
    setMode("guest");
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem(GUEST_KEY);
    await supabase.auth.signOut();
    setMode("signed-out");
  }, []);

  // MUTATIONS ---------
  const addTransaction = useCallback<Ctx["addTransaction"]>(
    async (t) => {
      if (mode === "guest") {
        const next = [{ ...t, id: Math.random().toString(36).slice(2, 10) }, ...transactions];
        setTxns(next);
        saveLS(LS_TXN, next);
        return;
      }
      if (mode === "auth" && userId) {
        const { data, error } = await supabase
          .from("transactions")
          .insert({ ...t, user_id: userId })
          .select("*")
          .single();
        if (error) throw error;
        setTxns((prev) => [
          {
            id: data.id,
            kind: data.kind as TxnKind,
            amount: Number(data.amount),
            category: data.category,
            merchant: data.merchant,
            note: data.note,
            mood: data.mood,
            tags: data.tags ?? [],
            occurred_at: data.occurred_at,
          },
          ...prev,
        ]);
      }
    },
    [mode, userId, transactions],
  );

  const updateTransaction = useCallback<Ctx["updateTransaction"]>(
    async (id, patch) => {
      if (mode === "guest") {
        const next = transactions.map((t) => (t.id === id ? { ...t, ...patch } : t));
        setTxns(next);
        saveLS(LS_TXN, next);
        return;
      }
      if (mode === "auth") {
        const { error } = await supabase.from("transactions").update(patch).eq("id", id);
        if (error) throw error;
        setTxns((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
      }
    },
    [mode, transactions],
  );

  const deleteTransaction = useCallback<Ctx["deleteTransaction"]>(
    async (id) => {
      if (mode === "guest") {
        const next = transactions.filter((t) => t.id !== id);
        setTxns(next);
        saveLS(LS_TXN, next);
        return;
      }
      if (mode === "auth") {
        const { error } = await supabase.from("transactions").delete().eq("id", id);
        if (error) throw error;
        setTxns((prev) => prev.filter((t) => t.id !== id));
      }
    },
    [mode, transactions],
  );

  const addBudget = useCallback<Ctx["addBudget"]>(
    async (b) => {
      if (mode === "guest") {
        const next = [...budgets, { ...b, id: Math.random().toString(36).slice(2, 10) }];
        setBudgets(next);
        saveLS(LS_BUD, next);
        return;
      }
      if (mode === "auth" && userId) {
        const { data, error } = await supabase
          .from("budgets")
          .upsert({ ...b, user_id: userId }, { onConflict: "user_id,category,period" })
          .select("*")
          .single();
        if (error) throw error;
        setBudgets((prev) => {
          const filtered = prev.filter((x) => !(x.category === data.category && x.period === data.period));
          return [
            ...filtered,
            { id: data.id, category: data.category, amount: Number(data.amount), period: data.period as "monthly" | "weekly" },
          ];
        });
      }
    },
    [mode, userId, budgets],
  );

  const deleteBudget = useCallback<Ctx["deleteBudget"]>(
    async (id) => {
      if (mode === "guest") {
        const next = budgets.filter((b) => b.id !== id);
        setBudgets(next);
        saveLS(LS_BUD, next);
        return;
      }
      if (mode === "auth") {
        await supabase.from("budgets").delete().eq("id", id);
        setBudgets((prev) => prev.filter((b) => b.id !== id));
      }
    },
    [mode, budgets],
  );

  const addBill = useCallback<Ctx["addBill"]>(
    async (b) => {
      if (mode === "guest") {
        const next = [...bills, { ...b, id: Math.random().toString(36).slice(2, 10) }];
        setBills(next);
        saveLS(LS_BILL, next);
        return;
      }
      if (mode === "auth" && userId) {
        const { data, error } = await supabase.from("bills").insert({ ...b, user_id: userId }).select("*").single();
        if (error) throw error;
        setBills((prev) => [
          ...prev,
          { id: data.id, name: data.name, amount: Number(data.amount), due_date: data.due_date, recurring: data.recurring },
        ]);
      }
    },
    [mode, userId, bills],
  );

  const deleteBill = useCallback<Ctx["deleteBill"]>(
    async (id) => {
      if (mode === "guest") {
        const next = bills.filter((b) => b.id !== id);
        setBills(next);
        saveLS(LS_BILL, next);
        return;
      }
      if (mode === "auth") {
        await supabase.from("bills").delete().eq("id", id);
        setBills((prev) => prev.filter((b) => b.id !== id));
      }
    },
    [mode, bills],
  );

  const value = useMemo<Ctx>(
    () => ({
      mode,
      displayName,
      transactions,
      budgets,
      bills,
      loading,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addBudget,
      deleteBudget,
      addBill,
      deleteBill,
      signOut,
      enterGuest,
    }),
    [mode, displayName, transactions, budgets, bills, loading, addTransaction, updateTransaction, deleteTransaction, addBudget, deleteBudget, addBill, deleteBill, signOut, enterGuest],
  );

  return <AppDataCtx.Provider value={value}>{children}</AppDataCtx.Provider>;
}

export function useAppData(): Ctx {
  const ctx = useContext(AppDataCtx);
  if (!ctx) throw new Error("useAppData must be inside AppDataProvider");
  return ctx;
}
