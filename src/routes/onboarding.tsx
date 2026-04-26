import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Wallet, Bitcoin, Sparkles, Banknote } from "lucide-react";
import { useAppStore } from "@/state/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { AccountType, CryptoSymbol, DCAFrequency } from "@/state/types";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

type Step = "welcome" | "account" | "income" | "dca" | "done";

function OnboardingPage() {
  const navigate = useNavigate();
  const { addAccount, addRecurringIncome, addDCAPlan, completeOnboarding } = useAppStore();
  const [step, setStep] = useState<Step>("welcome");

  const [accName, setAccName] = useState("Main Card");
  const [accType, setAccType] = useState<AccountType>("card");
  const [accBalance, setAccBalance] = useState("");
  const [createdAccountId, setCreatedAccountId] = useState<string | null>(null);

  const [incomeOn, setIncomeOn] = useState(false);
  const [incomeAmt, setIncomeAmt] = useState("");
  const [incomeName, setIncomeName] = useState("Salary");

  const [dcaOn, setDcaOn] = useState(false);
  const [dcaSymbol, setDcaSymbol] = useState<CryptoSymbol>("BTC");
  const [dcaAmount, setDcaAmount] = useState("100");
  const [dcaFreq, setDcaFreq] = useState<DCAFrequency>("weekly");

  const handleAccountNext = () => {
    const a = addAccount({
      name: accName.trim() || "Main",
      type: accType,
      balance: parseFloat(accBalance) || 0,
      currency: "USD",
    });
    setCreatedAccountId(a.id);
    setStep("income");
  };

  const handleIncomeNext = () => {
    if (incomeOn && createdAccountId && parseFloat(incomeAmt) > 0) {
      addRecurringIncome({
        name: incomeName.trim() || "Income",
        amount: parseFloat(incomeAmt),
        accountId: createdAccountId,
        dayOfMonth: 1,
      });
    }
    setStep("dca");
  };

  const handleDcaNext = () => {
    if (dcaOn && createdAccountId && parseFloat(dcaAmount) > 0) {
      addDCAPlan({
        symbol: dcaSymbol,
        amount: parseFloat(dcaAmount),
        frequency: dcaFreq,
        accountId: createdAccountId,
        startDate: new Date().toISOString(),
      });
    }
    setStep("done");
  };

  const finish = () => {
    completeOnboarding();
    navigate({ to: "/" });
  };

  return (
    <div className="relative flex min-h-screen flex-col px-6 pb-8 pt-12">
      <div className="pointer-events-none absolute inset-0 bg-gradient-hero" />
      <div className="relative flex flex-1 flex-col">
        <AnimatePresence mode="wait">
          {step === "welcome" && (
            <StepWrap key="welcome">
              <Logo />
              <h1 className="mt-8 font-display text-5xl font-bold leading-[1.05] tracking-tight">
                Your money,<br />
                <span className="text-primary">intelligently.</span>
              </h1>
              <p className="mt-4 text-base text-muted-foreground">
                A calm, precise financial OS. Net worth, cashflow, crypto and DCA — all in one place.
              </p>
              <FeatureList />
              <div className="flex-1" />
              <Button size="lg" className="h-14 w-full rounded-full text-base font-semibold" onClick={() => setStep("account")}>
                Get started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </StepWrap>
          )}

          {step === "account" && (
            <StepWrap key="account">
              <StepHeader index={1} total={3} title="Add your first account" subtitle="This is where money lives." />
              <div className="mt-8 space-y-5">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Account type</Label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(["card", "cash", "vault"] as AccountType[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setAccType(t)}
                        className={`rounded-2xl border p-4 text-center transition-all ${
                          accType === t
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border bg-surface text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div className="mb-1 flex justify-center">
                          {t === "card" && <Wallet className="h-5 w-5" />}
                          {t === "cash" && <Banknote className="h-5 w-5" />}
                          {t === "vault" && <Bitcoin className="h-5 w-5" />}
                        </div>
                        <div className="text-xs font-medium capitalize">{t}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="accName" className="text-xs uppercase tracking-wider text-muted-foreground">Name</Label>
                  <Input id="accName" value={accName} onChange={(e) => setAccName(e.target.value)} className="mt-2 h-12 rounded-xl bg-surface text-base" />
                </div>
                <div>
                  <Label htmlFor="accBalance" className="text-xs uppercase tracking-wider text-muted-foreground">Starting balance</Label>
                  <div className="relative mt-2">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="accBalance"
                      type="number"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={accBalance}
                      onChange={(e) => setAccBalance(e.target.value)}
                      className="h-14 rounded-xl bg-surface pl-8 font-display text-2xl font-semibold tabular"
                    />
                  </div>
                </div>
              </div>
              <div className="flex-1" />
              <Button size="lg" className="h-14 w-full rounded-full text-base font-semibold" onClick={handleAccountNext}>
                Continue <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </StepWrap>
          )}

          {step === "income" && (
            <StepWrap key="income">
              <StepHeader index={2} total={3} title="Recurring income" subtitle="Optional — helps track your cashflow." />
              <div className="mt-8 flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
                <div>
                  <div className="font-medium">Enable recurring income</div>
                  <div className="text-xs text-muted-foreground">e.g. salary, freelance retainer</div>
                </div>
                <Switch checked={incomeOn} onCheckedChange={setIncomeOn} />
              </div>
              {incomeOn && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-5">
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Source</Label>
                    <Input value={incomeName} onChange={(e) => setIncomeName(e.target.value)} className="mt-2 h-12 rounded-xl bg-surface" />
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Amount per month</Label>
                    <div className="relative mt-2">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        placeholder="3500"
                        value={incomeAmt}
                        onChange={(e) => setIncomeAmt(e.target.value)}
                        className="h-14 rounded-xl bg-surface pl-8 font-display text-2xl font-semibold tabular"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
              <div className="flex-1" />
              <Button size="lg" className="h-14 w-full rounded-full text-base font-semibold" onClick={handleIncomeNext}>
                Continue <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </StepWrap>
          )}

          {step === "dca" && (
            <StepWrap key="dca">
              <StepHeader index={3} total={3} title="Crypto DCA" subtitle="Optional — track BTC/ETH dollar-cost averaging." />
              <div className="mt-8 flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
                <div>
                  <div className="font-medium">Enable DCA tracking</div>
                  <div className="text-xs text-muted-foreground">Build discipline. Track streaks.</div>
                </div>
                <Switch checked={dcaOn} onCheckedChange={setDcaOn} />
              </div>
              {dcaOn && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-5">
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Asset</Label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {(["BTC", "ETH"] as CryptoSymbol[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => setDcaSymbol(s)}
                          className={`rounded-2xl border p-4 transition-all ${
                            dcaSymbol === s ? "border-primary bg-primary/10" : "border-border bg-surface text-muted-foreground"
                          }`}
                        >
                          <div className="font-display text-xl font-bold">{s}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Amount per cycle</Label>
                    <div className="relative mt-2">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={dcaAmount}
                        onChange={(e) => setDcaAmount(e.target.value)}
                        className="h-14 rounded-xl bg-surface pl-8 font-display text-2xl font-semibold tabular"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Frequency</Label>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {(["weekly", "biweekly", "monthly"] as DCAFrequency[]).map((f) => (
                        <button
                          key={f}
                          onClick={() => setDcaFreq(f)}
                          className={`rounded-xl border p-3 text-xs font-medium capitalize ${
                            dcaFreq === f ? "border-primary bg-primary/10" : "border-border bg-surface text-muted-foreground"
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              <div className="flex-1" />
              <Button size="lg" className="h-14 w-full rounded-full text-base font-semibold" onClick={handleDcaNext}>
                Continue <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </StepWrap>
          )}

          {step === "done" && (
            <StepWrap key="done">
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }}>
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-primary shadow-glow">
                    <Sparkles className="h-12 w-12 text-primary-foreground" />
                  </div>
                </motion.div>
                <h1 className="mt-8 font-display text-4xl font-bold leading-tight">You're set.</h1>
                <p className="mt-3 max-w-sm text-muted-foreground">
                  Aladdin is now watching your money. Insights will appear as you log activity.
                </p>
              </div>
              <Button size="lg" className="h-14 w-full rounded-full text-base font-semibold" onClick={finish}>
                Enter Aladdin <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </StepWrap>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StepWrap({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-1 flex-col"
    >
      {children}
    </motion.div>
  );
}

function StepHeader({ index, total, title, subtitle }: { index: number; total: number; title: string; subtitle: string }) {
  return (
    <div>
      <div className="mb-6 flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i < index ? "bg-primary" : "bg-border"}`} />
        ))}
      </div>
      <h1 className="font-display text-3xl font-bold leading-tight tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
        <Sparkles className="h-6 w-6 text-primary-foreground" strokeWidth={2.5} />
      </div>
      <div>
        <div className="font-display text-2xl font-bold tracking-tight">Aladdin</div>
        <div className="text-xs text-muted-foreground">Personal Financial OS</div>
      </div>
    </div>
  );
}

function FeatureList() {
  const items = [
    { icon: Wallet, label: "All accounts unified" },
    { icon: Bitcoin, label: "Crypto + DCA discipline" },
    { icon: Sparkles, label: "AI-driven insights" },
  ];
  return (
    <div className="mt-8 space-y-3">
      {items.map((it, i) => (
        <motion.div
          key={it.label}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 + i * 0.08 }}
          className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <it.icon className="h-5 w-5 text-primary" />
          </div>
          <div className="text-sm font-medium">{it.label}</div>
        </motion.div>
      ))}
    </div>
  );
}
