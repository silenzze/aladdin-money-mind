import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bitcoin, Plus, Flame, TrendingUp, TrendingDown, RefreshCw, Trash2, Power } from "lucide-react";
import { useAppStore } from "@/state/store";
import { computePositions } from "@/engines/cryptoEngine";
import { aggregateDCAStatuses } from "@/engines/dcaEngine";
import { formatCurrency, formatNumber, formatPercent, relativeDay } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CryptoSymbol, DCAFrequency } from "@/state/types";
import { toast } from "sonner";

export const Route = createFileRoute("/crypto")({
  head: () => ({
    meta: [
      { title: "Crypto — Aladdin" },
      { name: "description", content: "BTC and ETH portfolio with DCA discipline tracking." },
    ],
  }),
  component: CryptoPage,
});

function CryptoPage() {
  const {
    cryptoHoldings, prices, dcaPlans, accounts,
    addCryptoLot, removeCryptoLot, refreshPrices,
    addDCAPlan, toggleDCAPlan, removeDCAPlan, logDCAExecution,
  } = useAppStore();

  const positions = useMemo(() => computePositions(cryptoHoldings, prices), [cryptoHoldings, prices]);
  const dcaStatuses = useMemo(() => aggregateDCAStatuses(dcaPlans, cryptoHoldings), [dcaPlans, cryptoHoldings]);

  const totalValue = positions.reduce((s, p) => s + p.marketValue, 0);
  const totalCost = positions.reduce((s, p) => s + p.costBasis, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  const [showLot, setShowLot] = useState(false);
  const [lotSymbol, setLotSymbol] = useState<CryptoSymbol>("BTC");
  const [lotQty, setLotQty] = useState("");
  const [lotPrice, setLotPrice] = useState("");

  const [showDca, setShowDca] = useState(false);
  const [dcaSymbol, setDcaSymbol] = useState<CryptoSymbol>("BTC");
  const [dcaAmount, setDcaAmount] = useState("100");
  const [dcaFreq, setDcaFreq] = useState<DCAFrequency>("weekly");
  const [dcaAcc, setDcaAcc] = useState(accounts[0]?.id ?? "");

  const submitLot = () => {
    const q = parseFloat(lotQty);
    const p = parseFloat(lotPrice) || prices[lotSymbol];
    if (!q || q <= 0) return toast.error("Enter quantity");
    addCryptoLot({ symbol: lotSymbol, quantity: q, pricePerUnit: p, date: new Date().toISOString(), source: "manual" });
    toast.success("Lot added");
    setLotQty(""); setLotPrice(""); setShowLot(false);
  };

  const submitDca = () => {
    const amt = parseFloat(dcaAmount);
    if (!amt || amt <= 0) return toast.error("Enter amount");
    if (!dcaAcc) return toast.error("Pick an account");
    addDCAPlan({ symbol: dcaSymbol, amount: amt, frequency: dcaFreq, accountId: dcaAcc, startDate: new Date().toISOString() });
    toast.success("DCA plan created");
    setDcaAmount("100"); setShowDca(false);
  };

  return (
    <div className="px-5 pt-12">
      <PageHeader title="Crypto" subtitle="BTC · ETH portfolio" action={
        <button onClick={() => { refreshPrices(); toast.success("Prices refreshed"); }} className="rounded-full bg-surface p-2.5 text-muted-foreground hover:text-foreground">
          <RefreshCw className="h-4 w-4" />
        </button>
      } />

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-5 rounded-3xl border border-border bg-gradient-card p-5 shadow-card"
      >
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Portfolio value</p>
        <p className="mt-1 font-display text-4xl font-bold tabular">{formatCurrency(totalValue)}</p>
        <div className="mt-2 flex items-center gap-2 text-sm">
          {totalPnl >= 0 ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
          <span className={totalPnl >= 0 ? "text-success" : "text-destructive"}>
            {totalPnl >= 0 ? "+" : "−"}{formatCurrency(Math.abs(totalPnl))} ({formatPercent(totalPnlPct)})
          </span>
          <span className="text-muted-foreground">all time</span>
        </div>
      </motion.div>

      {/* Positions */}
      <h2 className="mt-7 font-display text-lg font-bold">Positions</h2>
      <div className="mt-3 space-y-2">
        {positions.map((p) => (
          <div key={p.symbol} className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Bitcoin className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-base font-bold">{p.symbol}</p>
                  <p className="text-[11px] text-muted-foreground tabular">
                    {formatNumber(p.quantity, 6)} · {formatCurrency(prices[p.symbol])}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display text-base font-bold tabular">{formatCurrency(p.marketValue)}</p>
                {p.quantity > 0 && (
                  <p className={`text-[11px] tabular ${p.unrealizedPnl >= 0 ? "text-success" : "text-destructive"}`}>
                    {formatPercent(p.unrealizedPnlPct)}
                  </p>
                )}
              </div>
            </div>
            {p.quantity > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                <Stat label="Avg cost" value={formatCurrency(p.averageCost)} />
                <Stat label="Invested" value={formatCurrency(p.costBasis)} />
                <Stat label="P&L" value={`${p.unrealizedPnl >= 0 ? "+" : "−"}${formatCurrency(Math.abs(p.unrealizedPnl))}`} tone={p.unrealizedPnl >= 0 ? "text-success" : "text-destructive"} />
              </div>
            )}
          </div>
        ))}
      </div>

      {!showLot ? (
        <button onClick={() => setShowLot(true)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-border py-3 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary">
          <Plus className="h-3.5 w-3.5" /> Log purchase
        </button>
      ) : (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 space-y-3 rounded-2xl border border-border bg-surface p-4">
          <div className="grid grid-cols-2 gap-2">
            {(["BTC", "ETH"] as CryptoSymbol[]).map((s) => (
              <button key={s} onClick={() => setLotSymbol(s)} className={`rounded-xl border p-3 font-display font-bold ${lotSymbol === s ? "border-primary bg-primary/10" : "border-border bg-background text-muted-foreground"}`}>{s}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] uppercase text-muted-foreground">Quantity</Label>
              <Input type="number" inputMode="decimal" value={lotQty} onChange={(e) => setLotQty(e.target.value)} className="mt-1 h-11 rounded-xl bg-background tabular" placeholder="0.05" />
            </div>
            <div>
              <Label className="text-[10px] uppercase text-muted-foreground">Price ({formatCurrency(prices[lotSymbol])})</Label>
              <Input type="number" inputMode="decimal" value={lotPrice} onChange={(e) => setLotPrice(e.target.value)} className="mt-1 h-11 rounded-xl bg-background tabular" placeholder={String(prices[lotSymbol])} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 rounded-full" onClick={() => setShowLot(false)}>Cancel</Button>
            <Button className="flex-1 rounded-full" onClick={submitLot}>Add lot</Button>
          </div>
        </motion.div>
      )}

      {/* DCA Plans */}
      <h2 className="mt-8 font-display text-lg font-bold">DCA Plans</h2>
      <div className="mt-3 space-y-2">
        {dcaStatuses.map((ds) => (
          <div key={ds.plan.id} className={`rounded-2xl border p-4 ${ds.plan.active ? "border-border bg-gradient-card" : "border-border bg-surface opacity-60"}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-display text-base font-bold">{ds.plan.symbol}</p>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">{ds.plan.frequency}</span>
                  {ds.streak >= 2 && <Flame className="h-4 w-4 text-primary" />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground tabular">
                  {formatCurrency(ds.plan.amount)} · {ds.cyclesCompleted}/{ds.cyclesExpected} cycles
                </p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => toggleDCAPlan(ds.plan.id)} className="rounded-full p-2 text-muted-foreground hover:text-foreground"><Power className="h-3.5 w-3.5" /></button>
                <button onClick={() => removeDCAPlan(ds.plan.id)} className="rounded-full p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-1.5 overflow-hidden rounded-full bg-border">
                <div className="h-full bg-gradient-primary" style={{ width: `${ds.disciplineScore}%` }} />
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Discipline {ds.disciplineScore}%</span>
                <span>Total {formatCurrency(ds.totalInvested)}</span>
              </div>
            </div>
            {ds.plan.active && (
              <button
                onClick={() => { logDCAExecution(ds.plan.id); toast.success("DCA logged · streak +1"); }}
                className="mt-3 w-full rounded-full bg-primary/15 py-2 text-xs font-semibold text-primary hover:bg-primary/25"
              >
                Log {ds.plan.symbol} purchase
              </button>
            )}
          </div>
        ))}
        {dcaStatuses.length === 0 && (
          <p className="text-center text-xs text-muted-foreground">No active DCA plans</p>
        )}
      </div>

      {!showDca ? (
        <button onClick={() => setShowDca(true)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-border py-3 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary">
          <Plus className="h-3.5 w-3.5" /> New DCA plan
        </button>
      ) : (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 space-y-3 rounded-2xl border border-border bg-surface p-4">
          <div className="grid grid-cols-2 gap-2">
            {(["BTC", "ETH"] as CryptoSymbol[]).map((s) => (
              <button key={s} onClick={() => setDcaSymbol(s)} className={`rounded-xl border p-3 font-display font-bold ${dcaSymbol === s ? "border-primary bg-primary/10" : "border-border bg-background text-muted-foreground"}`}>{s}</button>
            ))}
          </div>
          <div>
            <Label className="text-[10px] uppercase text-muted-foreground">Amount per cycle</Label>
            <div className="relative mt-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input type="number" inputMode="decimal" value={dcaAmount} onChange={(e) => setDcaAmount(e.target.value)} className="h-11 rounded-xl bg-background pl-7 font-display text-lg font-bold tabular" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["weekly", "biweekly", "monthly"] as DCAFrequency[]).map((f) => (
              <button key={f} onClick={() => setDcaFreq(f)} className={`rounded-xl border p-2 text-xs font-medium capitalize ${dcaFreq === f ? "border-primary bg-primary/10" : "border-border bg-background text-muted-foreground"}`}>{f}</button>
            ))}
          </div>
          <div>
            <Label className="text-[10px] uppercase text-muted-foreground">Funding account</Label>
            <select value={dcaAcc} onChange={(e) => setDcaAcc(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm">
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 rounded-full" onClick={() => setShowDca(false)}>Cancel</Button>
            <Button className="flex-1 rounded-full" onClick={submitDca}>Create plan</Button>
          </div>
        </motion.div>
      )}

      {/* Lots */}
      {cryptoHoldings.length > 0 && (
        <>
          <h2 className="mt-8 font-display text-lg font-bold">Lots</h2>
          <div className="mt-3 space-y-1 rounded-2xl border border-border bg-surface p-2">
            {cryptoHoldings.slice().sort((a, b) => +new Date(b.date) - +new Date(a.date)).map((l) => (
              <div key={l.id} className="group flex items-center justify-between rounded-xl px-2 py-2.5">
                <div>
                  <p className="text-sm font-semibold tabular">{formatNumber(l.quantity, 6)} {l.symbol}</p>
                  <p className="text-[11px] text-muted-foreground">@ {formatCurrency(l.pricePerUnit)} · {relativeDay(l.date)} · {l.source}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-mono-num text-sm font-semibold tabular">{formatCurrency(l.quantity * l.pricePerUnit)}</p>
                  <button onClick={() => removeCryptoLot(l.id)} className="rounded-full p-1.5 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-0.5 font-mono-num text-xs font-semibold tabular ${tone ?? "text-foreground"}`}>{value}</p>
    </div>
  );
}
