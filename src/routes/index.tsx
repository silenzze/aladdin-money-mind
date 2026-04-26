import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, ArrowUpRight, ArrowDownLeft, Bitcoin, Sparkles, ChevronRight, Flame, Zap } from "lucide-react";
import { useAppStore } from "@/state/store";
import { computeNetWorth } from "@/engines/netWorthEngine";
import { monthlyCashflow, todayCashflow } from "@/engines/financeEngine";
import { aggregateDCAStatuses } from "@/engines/dcaEngine";
import { generateInsights } from "@/engines/insightEngine";
import { formatCurrency, formatCompact, formatSignedCurrency } from "@/lib/format";
import { InsightCard } from "@/components/InsightCard";
import { NetWorthSparkline } from "@/components/NetWorthSparkline";
import { QuickAddSheet } from "@/components/QuickAddSheet";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aladdin — Home" },
      { name: "description", content: "Your net worth, cashflow and AI insights at a glance." },
      { property: "og:title", content: "Aladdin — Home" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const state = useAppStore();
  const { accounts, transactions, cryptoHoldings, prices, dcaPlans, dcaEnabled, recurringIncomes, refreshPrices } = state;
  const [quickOpen, setQuickOpen] = useState(false);

  // Light price refresh on mount for liveness
  useEffect(() => {
    const t = setTimeout(() => refreshPrices(), 800);
    return () => clearTimeout(t);
  }, [refreshPrices]);

  const nw = useMemo(() => computeNetWorth(accounts, cryptoHoldings, prices), [accounts, cryptoHoldings, prices]);
  const month = useMemo(() => monthlyCashflow(transactions), [transactions]);
  const today = useMemo(() => todayCashflow(transactions), [transactions]);
  const dcaStatuses = useMemo(() => aggregateDCAStatuses(dcaPlans, cryptoHoldings), [dcaPlans, cryptoHoldings]);
  const insights = useMemo(() => generateInsights(state), [state]);

  const monthDelta = month.income - month.expenses;
  const upcoming = recurringIncomes.slice(0, 2);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-hero" />

      <div className="relative px-5 pt-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Net worth</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</p>
          </div>
          <Link to="/settings" className="flex h-10 w-10 items-center justify-center rounded-full bg-surface">
            <span className="font-display text-sm font-bold text-primary">A</span>
          </Link>
        </div>

        {/* Hero net worth */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-3"
        >
          <h1 className="font-display text-[56px] font-bold leading-[1.05] tracking-tight tabular">
            {formatCurrency(nw.total)}
          </h1>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className={monthDelta >= 0 ? "text-success" : "text-destructive"}>
              {formatSignedCurrency(monthDelta)}
            </span>
            <span className="text-muted-foreground">this month</span>
          </div>
        </motion.div>

        {/* Sparkline */}
        <div className="mt-4">
          <NetWorthSparkline />
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>30d ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Composition */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-gradient-card p-4 shadow-card">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Cash</p>
            <p className="mt-1 font-display text-xl font-bold tabular">{formatCompact(nw.cash)}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{nw.cashPct.toFixed(0)}% of net</p>
          </div>
          <div className="rounded-2xl border border-border bg-gradient-card p-4 shadow-card">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Crypto</p>
            <p className="mt-1 font-display text-xl font-bold tabular">{formatCompact(nw.crypto)}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{nw.cryptoPct.toFixed(0)}% of net</p>
          </div>
        </div>

        {/* Cashflow row */}
        <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl border border-border bg-surface p-3">
          <CashStat label="Today" value={today.income - today.expenses} />
          <CashStat label="In" value={month.income} positive />
          <CashStat label="Out" value={-(month.expenses + month.invested)} />
        </div>

        {/* Quick action */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setQuickOpen(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-glow"
          >
            <Plus className="h-4 w-4" strokeWidth={2.6} /> Add transaction
          </button>
        </div>

        {/* DCA status */}
        {dcaEnabled && dcaStatuses.length > 0 && (
          <div className="mt-7">
            <SectionHeader title="DCA Discipline" to="/crypto" />
            <div className="mt-3 space-y-2">
              {dcaStatuses.map((ds) => (
                <Link
                  key={ds.plan.id}
                  to="/crypto"
                  className="flex items-center justify-between rounded-2xl border border-border bg-gradient-card p-4 shadow-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <Bitcoin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{ds.plan.symbol} · {formatCurrency(ds.plan.amount)} {ds.plan.frequency}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        {ds.streak >= 2 && <Flame className="h-3 w-3 text-primary" />}
                        {ds.cyclesCompleted} cycles · {ds.disciplineScore}% score
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-sm font-bold tabular">{formatCompact(ds.totalInvested)}</p>
                    {ds.missedCycles > 0 ? (
                      <p className="text-[11px] text-destructive">{ds.missedCycles} missed</p>
                    ) : (
                      <p className="text-[11px] text-success">on track</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="mt-7">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="font-display text-lg font-bold">Insights</h2>
            </div>
            <span className="text-[11px] font-medium text-muted-foreground">{insights.length} active</span>
          </div>
          <div className="mt-3 space-y-2.5">
            {insights.map((ins, i) => (
              <InsightCard key={ins.id} insight={ins} index={i} />
            ))}
          </div>
        </div>

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div className="mt-7">
            <SectionHeader title="Upcoming" to="/settings" />
            <div className="mt-3 space-y-2">
              {upcoming.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
                      <ArrowDownLeft className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{r.name}</p>
                      <p className="text-[11px] text-muted-foreground">Day {r.dayOfMonth} every month</p>
                    </div>
                  </div>
                  <p className="font-display text-sm font-bold tabular text-success">+{formatCompact(r.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent activity */}
        <div className="mt-7">
          <SectionHeader title="Recent activity" to="/transactions" />
          <div className="mt-3 space-y-1">
            {transactions.slice(0, 4).map((t) => {
              const acc = accounts.find((a) => a.id === t.accountId);
              const isIn = t.type === "income";
              const Icon = isIn ? ArrowDownLeft : t.type === "investment" ? Bitcoin : ArrowUpRight;
              const tone = isIn ? "text-success bg-success/10" : t.type === "investment" ? "text-primary bg-primary/15" : "text-foreground bg-accent";
              const sign = isIn ? "+" : "−";
              return (
                <div key={t.id} className="flex items-center justify-between rounded-xl px-2 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
                      <Icon className="h-4 w-4" strokeWidth={2.4} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t.category}</p>
                      <p className="text-[11px] text-muted-foreground">{acc?.name ?? "—"}</p>
                    </div>
                  </div>
                  <p className={`font-mono-num text-sm font-semibold ${isIn ? "text-success" : "text-foreground"}`}>
                    {sign}{formatCurrency(t.amount)}
                  </p>
                </div>
              );
            })}
            {transactions.length === 0 && (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-8 text-center">
                <Zap className="h-5 w-5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">No activity yet — log your first transaction</p>
              </div>
            )}
          </div>
        </div>

        <div className="h-8" />
      </div>

      <QuickAddSheet open={quickOpen} onClose={() => setQuickOpen(false)} />
    </div>
  );
}

function CashStat({ label, value, positive }: { label: string; value: number; positive?: boolean }) {
  const tone = positive ? "text-success" : value > 0 ? "text-success" : value < 0 ? "text-foreground" : "text-muted-foreground";
  return (
    <div className="text-center">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-sm font-bold tabular ${tone}`}>
        {formatSignedCurrency(value)}
      </p>
    </div>
  );
}

function SectionHeader({ title, to }: { title: string; to: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <Link to={to} className="flex items-center text-xs font-medium text-muted-foreground hover:text-foreground">
        View all <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
