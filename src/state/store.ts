import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Account,
  AppState,
  CryptoLot,
  CryptoSymbol,
  DCAPlan,
  RecurringIncome,
  Transaction,
  TxType,
} from "./types";

const uid = () => Math.random().toString(36).slice(2, 11);

interface Actions {
  completeOnboarding: () => void;
  setDcaEnabled: (v: boolean) => void;
  resetAll: () => void;

  addAccount: (a: Omit<Account, "id" | "createdAt">) => Account;
  removeAccount: (id: string) => void;

  addTransaction: (t: Omit<Transaction, "id">) => Transaction;
  removeTransaction: (id: string) => void;

  addCryptoLot: (l: Omit<CryptoLot, "id">) => CryptoLot;
  removeCryptoLot: (id: string) => void;
  logDCAExecution: (planId: string) => CryptoLot | null;

  addDCAPlan: (p: Omit<DCAPlan, "id" | "active">) => DCAPlan;
  toggleDCAPlan: (id: string) => void;
  removeDCAPlan: (id: string) => void;

  addRecurringIncome: (r: Omit<RecurringIncome, "id">) => RecurringIncome;
  removeRecurringIncome: (id: string) => void;

  refreshPrices: () => void;
}

const INITIAL: AppState = {
  onboardingCompleted: false,
  dcaEnabled: false,
  baseCurrency: "USD",
  accounts: [],
  transactions: [],
  cryptoHoldings: [],
  dcaPlans: [],
  recurringIncomes: [],
  prices: { BTC: 67000, ETH: 3400, updatedAt: new Date().toISOString() },
};

export const useAppStore = create<AppState & Actions>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      completeOnboarding: () => set({ onboardingCompleted: true }),
      setDcaEnabled: (v) => set({ dcaEnabled: v }),
      resetAll: () => set({ ...INITIAL, prices: { BTC: 67000, ETH: 3400, updatedAt: new Date().toISOString() } }),

      addAccount: (a) => {
        const account: Account = { ...a, id: uid(), createdAt: new Date().toISOString() };
        set((s) => ({ accounts: [...s.accounts, account] }));
        return account;
      },
      removeAccount: (id) =>
        set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) })),

      addTransaction: (t) => {
        const tx: Transaction = { ...t, id: uid() };
        set((s) => {
          const accounts = s.accounts.map((a) => {
            if (tx.type === "transfer") {
              if (a.id === tx.accountId) return { ...a, balance: a.balance - tx.amount };
              if (a.id === tx.toAccountId) return { ...a, balance: a.balance + tx.amount };
              return a;
            }
            if (a.id !== tx.accountId) return a;
            const delta =
              tx.type === "income" ? tx.amount :
              tx.type === "expense" ? -tx.amount :
              tx.type === "investment" ? -tx.amount : 0;
            return { ...a, balance: a.balance + delta };
          });
          return { transactions: [tx, ...s.transactions], accounts };
        });
        return tx;
      },
      removeTransaction: (id) => {
        const tx = get().transactions.find((t) => t.id === id);
        if (!tx) return;
        set((s) => {
          const accounts = s.accounts.map((a) => {
            if (tx.type === "transfer") {
              if (a.id === tx.accountId) return { ...a, balance: a.balance + tx.amount };
              if (a.id === tx.toAccountId) return { ...a, balance: a.balance - tx.amount };
              return a;
            }
            if (a.id !== tx.accountId) return a;
            const delta =
              tx.type === "income" ? -tx.amount :
              tx.type === "expense" ? tx.amount :
              tx.type === "investment" ? tx.amount : 0;
            return { ...a, balance: a.balance + delta };
          });
          return { transactions: s.transactions.filter((t) => t.id !== id), accounts };
        });
      },

      addCryptoLot: (l) => {
        const lot: CryptoLot = { ...l, id: uid() };
        set((s) => ({ cryptoHoldings: [...s.cryptoHoldings, lot] }));
        return lot;
      },
      removeCryptoLot: (id) => set((s) => ({ cryptoHoldings: s.cryptoHoldings.filter((l) => l.id !== id) })),

      logDCAExecution: (planId) => {
        const state = get();
        const plan = state.dcaPlans.find((p) => p.id === planId);
        if (!plan) return null;
        const price = state.prices[plan.symbol];
        const quantity = plan.amount / price;
        const lot: CryptoLot = {
          id: uid(),
          symbol: plan.symbol,
          quantity,
          pricePerUnit: price,
          date: new Date().toISOString(),
          source: "dca",
        };
        // Also create matching investment transaction
        const tx: Transaction = {
          id: uid(),
          type: "investment",
          amount: plan.amount,
          category: `${plan.symbol} DCA`,
          accountId: plan.accountId,
          date: new Date().toISOString(),
        };
        set((s) => {
          const accounts = s.accounts.map((a) =>
            a.id === plan.accountId ? { ...a, balance: a.balance - plan.amount } : a,
          );
          return {
            cryptoHoldings: [...s.cryptoHoldings, lot],
            transactions: [tx, ...s.transactions],
            dcaPlans: s.dcaPlans.map((p) => (p.id === planId ? { ...p, lastExecuted: lot.date } : p)),
            accounts,
          };
        });
        return lot;
      },

      addDCAPlan: (p) => {
        const plan: DCAPlan = { ...p, id: uid(), active: true };
        set((s) => ({ dcaPlans: [...s.dcaPlans, plan], dcaEnabled: true }));
        return plan;
      },
      toggleDCAPlan: (id) =>
        set((s) => ({ dcaPlans: s.dcaPlans.map((p) => (p.id === id ? { ...p, active: !p.active } : p)) })),
      removeDCAPlan: (id) => set((s) => ({ dcaPlans: s.dcaPlans.filter((p) => p.id !== id) })),

      addRecurringIncome: (r) => {
        const inc: RecurringIncome = { ...r, id: uid() };
        set((s) => ({ recurringIncomes: [...s.recurringIncomes, inc] }));
        return inc;
      },
      removeRecurringIncome: (id) =>
        set((s) => ({ recurringIncomes: s.recurringIncomes.filter((r) => r.id !== id) })),

      refreshPrices: () => {
        // Simulated drift — deterministic-ish jitter
        const cur = get().prices;
        const drift = (v: number) => v * (1 + (Math.random() - 0.5) * 0.01);
        set({
          prices: {
            BTC: Math.round(drift(cur.BTC)),
            ETH: Math.round(drift(cur.ETH)),
            updatedAt: new Date().toISOString(),
          },
        });
      },
    }),
    {
      name: "aladdin-state-v1",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : ({} as Storage))),
    },
  ),
);

export const TXType: TxType[] = ["income", "expense", "investment", "transfer"];
export const CRYPTO_SYMBOLS: CryptoSymbol[] = ["BTC", "ETH"];
