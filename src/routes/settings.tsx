import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Trash2, ChevronRight, Plus, Power } from "lucide-react";
import { useAppStore } from "@/state/store";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Aladdin" },
      { name: "description", content: "Recurring income, DCA tracking and data control." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { dcaEnabled, setDcaEnabled, recurringIncomes, addRecurringIncome, removeRecurringIncome, accounts, resetAll } = useAppStore();
  const navigate = useNavigate();

  const [showInc, setShowInc] = useState(false);
  const [name, setName] = useState("Salary");
  const [amount, setAmount] = useState("");
  const [day, setDay] = useState("1");
  const [acc, setAcc] = useState(accounts[0]?.id ?? "");

  const submit = () => {
    const a = parseFloat(amount);
    if (!a) return toast.error("Enter amount");
    if (!acc) return toast.error("Pick account");
    addRecurringIncome({ name: name.trim() || "Income", amount: a, accountId: acc, dayOfMonth: Math.min(28, Math.max(1, parseInt(day) || 1)) });
    toast.success("Recurring income added");
    setAmount(""); setShowInc(false);
  };

  const wipe = () => {
    if (!confirm("Reset all data? This cannot be undone.")) return;
    resetAll();
    toast.success("Wiped clean");
    navigate({ to: "/onboarding" });
  };

  return (
    <div className="px-5 pt-12">
      <PageHeader title="Settings" />

      <div className="mt-6 flex items-center gap-3 rounded-3xl border border-border bg-gradient-card p-4 shadow-card">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
          <Sparkles className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <p className="font-display text-lg font-bold">Aladdin</p>
          <p className="text-xs text-muted-foreground">Personal Financial OS · v1.0</p>
        </div>
      </div>

      {/* DCA toggle */}
      <Section title="Modules">
        <Row>
          <div>
            <p className="text-sm font-semibold">DCA tracking</p>
            <p className="text-[11px] text-muted-foreground">Show DCA discipline on home & enable plans</p>
          </div>
          <Switch checked={dcaEnabled} onCheckedChange={setDcaEnabled} />
        </Row>
      </Section>

      {/* Recurring income */}
      <Section title="Recurring income" actionLabel="Add" onAction={() => setShowInc(true)}>
        <div className="space-y-1 rounded-2xl border border-border bg-surface p-2">
          {recurringIncomes.map((r) => {
            const account = accounts.find((a) => a.id === r.accountId);
            return (
              <div key={r.id} className="group flex items-center justify-between rounded-xl px-2 py-2.5">
                <div>
                  <p className="text-sm font-semibold">{r.name}</p>
                  <p className="text-[11px] text-muted-foreground">Day {r.dayOfMonth} · {account?.name ?? "—"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-mono-num text-sm font-semibold text-success tabular">+{formatCurrency(r.amount)}</p>
                  <button onClick={() => removeRecurringIncome(r.id)} className="rounded-full p-1.5 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
          {recurringIncomes.length === 0 && <p className="px-2 py-3 text-center text-xs text-muted-foreground">None yet</p>}
        </div>

        {showInc && (
          <div className="mt-3 space-y-3 rounded-2xl border border-border bg-surface p-4">
            <div>
              <Label className="text-[10px] uppercase text-muted-foreground">Source</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-11 rounded-xl bg-background" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] uppercase text-muted-foreground">Amount</Label>
                <div className="relative mt-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-11 rounded-xl bg-background pl-7 tabular" />
                </div>
              </div>
              <div>
                <Label className="text-[10px] uppercase text-muted-foreground">Day (1–28)</Label>
                <Input type="number" min={1} max={28} value={day} onChange={(e) => setDay(e.target.value)} className="mt-1 h-11 rounded-xl bg-background tabular" />
              </div>
            </div>
            <div>
              <Label className="text-[10px] uppercase text-muted-foreground">Into account</Label>
              <select value={acc} onChange={(e) => setAcc(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm">
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-full" onClick={() => setShowInc(false)}>Cancel</Button>
              <Button className="flex-1 rounded-full" onClick={submit}>Add</Button>
            </div>
          </div>
        )}
      </Section>

      {/* Data */}
      <Section title="Data">
        <button onClick={wipe} className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface px-4 py-4 text-left hover:border-destructive">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Trash2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Reset all data</p>
              <p className="text-[11px] text-muted-foreground">Wipe accounts, transactions and start fresh</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </Section>

      <p className="mt-8 text-center text-[11px] text-muted-foreground">
        Built with deterministic engines. All data lives on your device.
      </p>
      <div className="h-4" />
    </div>
  );
}

function Section({ title, children, actionLabel, onAction }: { title: string; children: React.ReactNode; actionLabel?: string; onAction?: () => void }) {
  return (
    <section className="mt-7">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
        {actionLabel && (
          <button onClick={onAction} className="flex items-center gap-1 text-xs font-medium text-primary"><Plus className="h-3 w-3" />{actionLabel}</button>
        )}
      </div>
      {children}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">{children}</div>;
}

// Avoid unused-import warning
void Power;
