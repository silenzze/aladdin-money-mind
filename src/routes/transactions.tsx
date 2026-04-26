import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Bitcoin, ArrowRightLeft, Plus, Trash2 } from "lucide-react";
import { useAppStore } from "@/state/store";
import { formatCurrency, relativeDay } from "@/lib/format";
import { monthlyCashflow } from "@/engines/financeEngine";
import { PageHeader } from "@/components/PageHeader";
import { QuickAddSheet } from "@/components/QuickAddSheet";
import type { Transaction, TxType } from "@/state/types";

export const Route = createFileRoute("/transactions")({
  head: () => ({
    meta: [
      { title: "Activity — Aladdin" },
      { name: "description", content: "Every income, expense, investment and transfer." },
    ],
  }),
  component: TxPage,
});

const FILTERS: Array<{ key: TxType | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "income", label: "Income" },
  { key: "expense", label: "Expense" },
  { key: "investment", label: "Invest" },
  { key: "transfer", label: "Transfer" },
];

function TxPage() {
  const { transactions, accounts, removeTransaction } = useAppStore();
  const [filter, setFilter] = useState<TxType | "all">("all");
  const [open, setOpen] = useState(false);

  const month = useMemo(() => monthlyCashflow(transactions), [transactions]);
  const filtered = transactions.filter((t) => filter === "all" || t.type === filter);

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of filtered) {
      const key = relativeDay(t.date);
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="px-5 pt-12">
      <PageHeader
        title="Activity"
        subtitle={`${transactions.length} entries · net ${formatCurrency(month.income - month.expenses - month.invested)} this month`}
      />

      {/* Filters */}
      <div className="mt-5 -mx-5 overflow-x-auto px-5">
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                filter === f.key ? "border-primary bg-primary/10 text-foreground" : "border-border bg-surface text-muted-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => setOpen(true)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow"
      >
        <Plus className="h-4 w-4" strokeWidth={2.6} /> Add transaction
      </button>

      <div className="mt-6 space-y-6">
        {groups.map(([day, items]) => (
          <div key={day}>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{day}</p>
            <div className="space-y-1 rounded-2xl border border-border bg-surface p-2">
              {items.map((t) => {
                const acc = accounts.find((a) => a.id === t.accountId);
                const meta = TX_META(t.type);
                const sign = t.type === "income" ? "+" : t.type === "transfer" ? "" : "−";
                return (
                  <div key={t.id} className="group flex items-center justify-between rounded-xl px-2 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${meta.tone}`}>
                        <meta.icon className="h-4.5 w-4.5" strokeWidth={2.3} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{t.category}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {acc?.name ?? "—"}{t.note ? ` · ${t.note}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={`font-mono-num text-sm font-semibold ${meta.color}`}>
                        {sign}{formatCurrency(t.amount)}
                      </p>
                      <button
                        onClick={() => removeTransaction(t.id)}
                        className="rounded-full p-1.5 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            No transactions match this filter
          </div>
        )}
      </div>

      <QuickAddSheet open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function TX_META(type: TxType) {
  switch (type) {
    case "income": return { icon: ArrowDownLeft, tone: "text-success bg-success/10", color: "text-success" };
    case "expense": return { icon: ArrowUpRight, tone: "text-destructive bg-destructive/10", color: "text-foreground" };
    case "investment": return { icon: Bitcoin, tone: "text-primary bg-primary/15", color: "text-primary" };
    case "transfer": return { icon: ArrowRightLeft, tone: "text-foreground bg-accent", color: "text-muted-foreground" };
  }
}
