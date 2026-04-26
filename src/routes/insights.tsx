import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, TrendingDown, PieChart as PieIcon } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { InsightCard } from "@/components/InsightCard";
import { useAppStore } from "@/state/store";
import { generateInsights } from "@/engines/insightEngine";
import { expensesByCategory, monthlyCashflow, previousMonthCashflow } from "@/engines/financeEngine";
import { formatCurrency, formatCompact } from "@/lib/format";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Aladdin — Insights" },
      { name: "description", content: "AI-driven intelligence on your spending, saving and investing patterns." },
    ],
  }),
  component: InsightsPage,
});

const CATEGORY_TONES = [
  "from-primary/30 to-primary/5",
  "from-success/30 to-success/5",
  "from-accent/40 to-accent/5",
  "from-destructive/30 to-destructive/5",
  "from-muted/40 to-muted/5",
];

function InsightsPage() {
  const state = useAppStore();
  const { transactions } = state;

  const insights = useMemo(() => generateInsights(state), [state]);
  const month = useMemo(() => monthlyCashflow(transactions), [transactions]);
  const prev = useMemo(() => previousMonthCashflow(transactions), [transactions]);
  const categories = useMemo(() => expensesByCategory(transactions), [transactions]);

  const totalCat = categories.reduce((s, c) => s + c.amount, 0);
  const expenseDelta = prev.expenses > 0 ? ((month.expenses - prev.expenses) / prev.expenses) * 100 : 0;
  const incomeDelta = prev.income > 0 ? ((month.income - prev.income) / prev.income) * 100 : 0;

  return (
    <div className="px-5 pt-12">
      <PageHeader
        title="Insights"
        subtitle="Intelligence from your money patterns"
        action={
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
        }
      />

      {/* Month vs prev */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <DeltaCard label="Income" value={month.income} delta={incomeDelta} positiveIsGood />
        <DeltaCard label="Expenses" value={month.expenses} delta={expenseDelta} positiveIsGood={false} />
      </div>

      {/* AI Feed */}
      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">AI feed</h2>
          <span className="text-[11px] font-medium text-muted-foreground">{insights.length} signals</span>
        </div>
        <div className="space-y-2.5">
          {insights.map((ins, i) => (
            <InsightCard key={ins.id} insight={ins} index={i} />
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <PieIcon className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-bold">Where it goes</h2>
        </div>
        {categories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-10 text-center text-xs text-muted-foreground">
            Log expenses to see your category breakdown.
          </div>
        ) : (
          <div className="space-y-2">
            {categories.slice(0, 8).map((c, i) => {
              const pct = (c.amount / totalCat) * 100;
              return (
                <motion.div
                  key={c.category}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i, duration: 0.35 }}
                  className={`relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r ${CATEGORY_TONES[i % CATEGORY_TONES.length]} p-4`}
                >
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{c.category}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{pct.toFixed(0)}% of spending</p>
                    </div>
                    <p className="font-display text-base font-bold tabular">{formatCompact(c.amount)}</p>
                  </div>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-background/40">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.1 + 0.04 * i, duration: 0.6, ease: "easeOut" }}
                      className="h-full rounded-full bg-foreground/70"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      <div className="h-8" />
    </div>
  );
}

function DeltaCard({
  label,
  value,
  delta,
  positiveIsGood,
}: {
  label: string;
  value: number;
  delta: number;
  positiveIsGood: boolean;
}) {
  const good = positiveIsGood ? delta >= 0 : delta <= 0;
  const Arrow = delta >= 0 ? TrendingUp : TrendingDown;
  const tone = good ? "text-success" : "text-destructive";
  return (
    <div className="rounded-2xl border border-border bg-gradient-card p-4 shadow-card">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-bold tabular">{formatCurrency(value)}</p>
      <div className={`mt-1 flex items-center gap-1 text-[11px] ${tone}`}>
        <Arrow className="h-3 w-3" strokeWidth={2.4} />
        {Math.abs(delta).toFixed(0)}% vs last month
      </div>
    </div>
  );
}
