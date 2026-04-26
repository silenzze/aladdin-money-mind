import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Wallet, Banknote, Lock, Trash2 } from "lucide-react";
import { useAppStore } from "@/state/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import type { AccountType } from "@/state/types";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/accounts")({
  head: () => ({
    meta: [
      { title: "Accounts — Aladdin" },
      { name: "description", content: "Cards, cash and vaults — all your money buckets." },
    ],
  }),
  component: AccountsPage,
});

const TYPE_META: Record<AccountType, { label: string; icon: typeof Wallet; tone: string }> = {
  card: { label: "Card", icon: Wallet, tone: "text-primary bg-primary/15" },
  cash: { label: "Cash", icon: Banknote, tone: "text-success bg-success/10" },
  vault: { label: "Vault", icon: Lock, tone: "text-foreground bg-accent" },
};

function AccountsPage() {
  const { accounts, addAccount, removeAccount } = useAppStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("card");
  const [balance, setBalance] = useState("");

  const total = accounts.reduce((s, a) => s + a.balance, 0);

  const submit = () => {
    if (!name.trim()) return toast.error("Name required");
    addAccount({ name: name.trim(), type, balance: parseFloat(balance) || 0, currency: "USD" });
    toast.success("Account added");
    setName(""); setBalance(""); setOpen(false);
  };

  return (
    <div className="px-5 pt-12">
      <PageHeader title="Accounts" subtitle={`${accounts.length} active · ${formatCurrency(total)} total`} />

      <div className="mt-6 space-y-3">
        {accounts.map((a, i) => {
          const meta = TYPE_META[a.type];
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="group flex items-center justify-between rounded-2xl border border-border bg-gradient-card p-4 shadow-card"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${meta.tone}`}>
                  <meta.icon className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{a.name}</p>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{meta.label}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-display text-lg font-bold tabular">{formatCurrency(a.balance)}</p>
                <button
                  onClick={() => { removeAccount(a.id); toast.success("Removed"); }}
                  className="rounded-full p-1.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary"
        >
          <Plus className="h-4 w-4" /> New account
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 space-y-4 rounded-2xl border border-border bg-surface p-4"
        >
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(TYPE_META) as AccountType[]).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`rounded-xl border p-3 text-center transition-all ${
                  type === t ? "border-primary bg-primary/10" : "border-border bg-background text-muted-foreground"
                }`}
              >
                {(() => { const I = TYPE_META[t].icon; return <I className="mx-auto mb-1 h-4 w-4" />; })()}
                <span className="text-[11px] font-medium">{TYPE_META[t].label}</span>
              </button>
            ))}
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 h-11 rounded-xl bg-background" placeholder="e.g. Revolut" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Balance</Label>
            <div className="relative mt-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input type="number" inputMode="decimal" value={balance} onChange={(e) => setBalance(e.target.value)} className="h-12 rounded-xl bg-background pl-8 font-display text-xl font-bold tabular" placeholder="0.00" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 rounded-full" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="flex-1 rounded-full" onClick={submit}>Add account</Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
