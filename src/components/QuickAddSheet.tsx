import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowDownLeft, ArrowUpRight, Bitcoin, ArrowRightLeft } from "lucide-react";
import { useAppStore } from "@/state/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { TxType } from "@/state/types";
import { toast } from "sonner";

const TYPES: { type: TxType; label: string; icon: typeof ArrowDownLeft; tone: string }[] = [
  { type: "income", label: "Income", icon: ArrowDownLeft, tone: "text-success bg-success/10" },
  { type: "expense", label: "Expense", icon: ArrowUpRight, tone: "text-destructive bg-destructive/10" },
  { type: "investment", label: "Invest", icon: Bitcoin, tone: "text-primary bg-primary/15" },
  { type: "transfer", label: "Transfer", icon: ArrowRightLeft, tone: "text-foreground bg-accent" },
];

const CATEGORIES: Record<TxType, string[]> = {
  income: ["Salary", "Freelance", "Refund", "Gift", "Other"],
  expense: ["Food", "Transport", "Rent", "Bills", "Shopping", "Health", "Fun", "Other"],
  investment: ["BTC", "ETH", "Stocks", "Other"],
  transfer: ["Transfer"],
};

export function QuickAddSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { accounts, addTransaction } = useAppStore();
  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [note, setNote] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id ?? "");

  const handleSelectType = (t: TxType) => {
    setType(t);
    setCategory(CATEGORIES[t][0]);
  };

  const submit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (!accountId) return toast.error("Pick an account");
    if (type === "transfer" && (!toAccountId || toAccountId === accountId)) return toast.error("Pick a different destination");

    addTransaction({
      type,
      amount: amt,
      category,
      note: note.trim() || undefined,
      accountId,
      toAccountId: type === "transfer" ? toAccountId : undefined,
      date: new Date().toISOString(),
    });
    toast.success(`${type[0].toUpperCase() + type.slice(1)} logged`);
    setAmount("");
    setNote("");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-1/2 z-50 w-full max-w-[440px] -translate-x-1/2 rounded-t-3xl border border-border bg-popover p-5 shadow-elevated"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Quick add</h2>
              <button onClick={onClose} className="rounded-full p-2 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {TYPES.map((t) => {
                const active = type === t.type;
                return (
                  <button
                    key={t.type}
                    onClick={() => handleSelectType(t.type)}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition-all ${
                      active ? "border-primary bg-primary/10" : "border-border bg-surface text-muted-foreground"
                    }`}
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${t.tone}`}>
                      <t.icon className="h-4 w-4" strokeWidth={2.4} />
                    </div>
                    <span className="text-[11px] font-medium">{t.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Amount</Label>
              <div className="relative mt-2">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display text-2xl text-muted-foreground">$</span>
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                  className="h-16 rounded-2xl bg-surface pl-10 font-display text-3xl font-bold tabular"
                />
              </div>
            </div>

            {type !== "transfer" && (
              <div className="mt-4">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Category</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CATEGORIES[type].map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                        category === c ? "border-primary bg-primary/10 text-foreground" : "border-border bg-surface text-muted-foreground"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                {type === "transfer" ? "From" : "Account"}
              </Label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-border bg-surface px-3 text-sm"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            {type === "transfer" && (
              <div className="mt-3">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">To</Label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-border bg-surface px-3 text-sm"
                >
                  {accounts.filter((a) => a.id !== accountId).map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="mt-3">
              <Input
                placeholder="Note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-12 rounded-xl bg-surface"
              />
            </div>

            <Button onClick={submit} size="lg" className="mt-5 h-14 w-full rounded-full text-base font-semibold">
              Save
            </Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
