import type { CryptoLot, DCAFrequency, DCAPlan } from "@/state/types";

const DAY_MS = 1000 * 60 * 60 * 24;

const intervalDays = (freq: DCAFrequency): number =>
  freq === "weekly" ? 7 : freq === "biweekly" ? 14 : 30;

export interface DCAStatus {
  plan: DCAPlan;
  nextExecution: string; // ISO
  cyclesCompleted: number;
  cyclesExpected: number;
  missedCycles: number;
  streak: number; // consecutive on-time cycles
  totalInvested: number;
  disciplineScore: number; // 0-100
}

export const computeDCAStatus = (plan: DCAPlan, lots: CryptoLot[]): DCAStatus => {
  const planLots = lots
    .filter((l) => l.source === "dca" && l.symbol === plan.symbol && new Date(l.date) >= new Date(plan.startDate))
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));

  const interval = intervalDays(plan.frequency);
  const start = new Date(plan.startDate).getTime();
  const now = Date.now();
  const elapsedDays = Math.max(0, Math.floor((now - start) / DAY_MS));
  const cyclesExpected = Math.floor(elapsedDays / interval) + 1;
  const cyclesCompleted = planLots.length;
  const missedCycles = Math.max(0, cyclesExpected - cyclesCompleted);

  // streak: walk back from latest lot, check spacing close to interval (±2 days)
  let streak = 0;
  for (let i = planLots.length - 1; i > 0; i--) {
    const gap = (+new Date(planLots[i].date) - +new Date(planLots[i - 1].date)) / DAY_MS;
    if (Math.abs(gap - interval) <= 2) streak++;
    else break;
  }
  if (planLots.length > 0) streak += 1; // count the last as part

  const totalInvested = planLots.reduce((s, l) => s + l.quantity * l.pricePerUnit, 0);

  const disciplineScore =
    cyclesExpected === 0 ? 100 : Math.round((cyclesCompleted / cyclesExpected) * 100);

  const lastDate = planLots.length > 0 ? new Date(planLots[planLots.length - 1].date) : new Date(plan.startDate);
  const nextExecution = new Date(lastDate.getTime() + interval * DAY_MS).toISOString();

  return {
    plan,
    nextExecution,
    cyclesCompleted,
    cyclesExpected,
    missedCycles,
    streak,
    totalInvested,
    disciplineScore: Math.min(100, disciplineScore),
  };
};

export const aggregateDCAStatuses = (plans: DCAPlan[], lots: CryptoLot[]): DCAStatus[] =>
  plans.filter((p) => p.active).map((p) => computeDCAStatus(p, lots));
