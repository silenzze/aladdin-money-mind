import type { Account, Transaction } from "@/state/types";

export interface CashflowSummary {
  income: number;
  expenses: number;
  invested: number;
  net: number;
}

const isInMonth = (iso: string, year: number, month: number): boolean => {
  const d = new Date(iso);
  return d.getFullYear() === year && d.getMonth() === month;
};

const isToday = (iso: string): boolean => {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
};

export const summarize = (txs: Transaction[]): CashflowSummary => {
  let income = 0, expenses = 0, invested = 0;
  for (const t of txs) {
    if (t.type === "income") income += t.amount;
    else if (t.type === "expense") expenses += t.amount;
    else if (t.type === "investment") invested += t.amount;
  }
  return { income, expenses, invested, net: income - expenses - invested };
};

export const monthlyCashflow = (txs: Transaction[], date = new Date()): CashflowSummary =>
  summarize(txs.filter((t) => isInMonth(t.date, date.getFullYear(), date.getMonth())));

export const todayCashflow = (txs: Transaction[]): CashflowSummary =>
  summarize(txs.filter((t) => isToday(t.date)));

export const previousMonthCashflow = (txs: Transaction[]): CashflowSummary => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return summarize(txs.filter((t) => isInMonth(t.date, d.getFullYear(), d.getMonth())));
};

export const totalCashBalance = (accounts: Account[]): number =>
  accounts.reduce((s, a) => s + a.balance, 0);

export const balanceByType = (accounts: Account[]) => ({
  card: accounts.filter((a) => a.type === "card").reduce((s, a) => s + a.balance, 0),
  cash: accounts.filter((a) => a.type === "cash").reduce((s, a) => s + a.balance, 0),
  vault: accounts.filter((a) => a.type === "vault").reduce((s, a) => s + a.balance, 0),
});

/** Group expenses by category for the current month. */
export const expensesByCategory = (txs: Transaction[]): Array<{ category: string; amount: number }> => {
  const now = new Date();
  const map = new Map<string, number>();
  for (const t of txs) {
    if (t.type !== "expense") continue;
    if (!isInMonth(t.date, now.getFullYear(), now.getMonth())) continue;
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  }
  return Array.from(map, ([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
};
