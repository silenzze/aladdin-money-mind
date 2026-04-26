import type { AppState, Insight } from "@/state/types";
import { monthlyCashflow, previousMonthCashflow, expensesByCategory } from "./financeEngine";
import { aggregateDCAStatuses } from "./dcaEngine";
import { computePositions } from "./cryptoEngine";
import { computeNetWorth, netWorthSeries } from "./netWorthEngine";

const id = () => Math.random().toString(36).slice(2, 10);

export const generateInsights = (s: AppState): Insight[] => {
  const insights: Insight[] = [];
  const now = new Date().toISOString();

  const thisMonth = monthlyCashflow(s.transactions);
  const lastMonth = previousMonthCashflow(s.transactions);
  const nw = computeNetWorth(s.accounts, s.cryptoHoldings, s.prices);
  const series = netWorthSeries(s.accounts, s.transactions, s.cryptoHoldings, s.prices, 14);
  const positions = computePositions(s.cryptoHoldings, s.prices);
  const dcaStatuses = aggregateDCAStatuses(s.dcaPlans, s.cryptoHoldings);

  // Spending change vs last month
  if (lastMonth.expenses > 0) {
    const change = ((thisMonth.expenses - lastMonth.expenses) / lastMonth.expenses) * 100;
    if (Math.abs(change) >= 10) {
      insights.push({
        id: id(),
        title: change > 0 ? `Spending up ${change.toFixed(0)}% this month` : `Spending down ${Math.abs(change).toFixed(0)}% this month`,
        body: change > 0
          ? "Your expenses are climbing compared to last month. Review your top categories."
          : "You're spending less than last month. Nice control.",
        severity: change > 0 ? "warning" : "positive",
        importance: Math.min(100, 50 + Math.abs(change)),
        createdAt: now,
        icon: change > 0 ? "trending-up" : "trending-down",
      });
    }
  }

  // Net worth trend
  if (series.length >= 7) {
    const start = series[0].value;
    const end = series[series.length - 1].value;
    if (start > 0) {
      const growth = ((end - start) / start) * 100;
      if (Math.abs(growth) >= 1) {
        insights.push({
          id: id(),
          title: growth > 0 ? `Net worth grew ${growth.toFixed(1)}% in 14d` : `Net worth dipped ${Math.abs(growth).toFixed(1)}% in 14d`,
          body: growth > 0 ? "Steady upward trend. Keep the habits going." : "A short-term dip — check expenses or market exposure.",
          severity: growth > 0 ? "positive" : "warning",
          importance: 60,
          createdAt: now,
          icon: growth > 0 ? "trending-up" : "trending-down",
        });
      }
    }
  }

  // DCA discipline
  for (const ds of dcaStatuses) {
    if (ds.missedCycles >= 1) {
      insights.push({
        id: id(),
        title: `You missed ${ds.missedCycles} ${ds.plan.symbol} DCA cycle${ds.missedCycles > 1 ? "s" : ""}`,
        body: `Stay on track to maintain your ${ds.plan.frequency} discipline. Log your purchase to keep the streak.`,
        severity: "warning",
        importance: 75,
        createdAt: now,
        icon: "alert-circle",
      });
    } else if (ds.streak >= 4) {
      insights.push({
        id: id(),
        title: `${ds.streak}-cycle ${ds.plan.symbol} streak 🔥`,
        body: `Discipline score ${ds.disciplineScore}%. Your consistent DCA is compounding.`,
        severity: "positive",
        importance: 65,
        createdAt: now,
        icon: "flame",
      });
    }
  }

  // DCA capacity insight
  if (thisMonth.income > 0 && thisMonth.net > thisMonth.income * 0.2 && s.dcaEnabled) {
    insights.push({
      id: id(),
      title: "You can safely increase DCA by 10%",
      body: `Your free cashflow this month is healthy (${((thisMonth.net / thisMonth.income) * 100).toFixed(0)}% of income).`,
      severity: "info",
      importance: 55,
      createdAt: now,
      icon: "zap",
    });
  }

  // Top expense category
  const cats = expensesByCategory(s.transactions);
  if (cats.length > 0 && thisMonth.expenses > 0) {
    const top = cats[0];
    const pct = (top.amount / thisMonth.expenses) * 100;
    if (pct >= 35) {
      insights.push({
        id: id(),
        title: `${top.category} is ${pct.toFixed(0)}% of spending`,
        body: "One category dominates your month. Consider whether it aligns with your priorities.",
        severity: "info",
        importance: 50,
        createdAt: now,
        icon: "pie-chart",
      });
    }
  }

  // Crypto PNL
  for (const p of positions) {
    if (p.quantity > 0 && Math.abs(p.unrealizedPnlPct) >= 15) {
      insights.push({
        id: id(),
        title: `${p.symbol} ${p.unrealizedPnlPct > 0 ? "up" : "down"} ${Math.abs(p.unrealizedPnlPct).toFixed(1)}% on cost`,
        body: `Avg cost ${p.averageCost.toFixed(0)}. Position now ${p.marketValue.toFixed(0)}.`,
        severity: p.unrealizedPnlPct > 0 ? "positive" : "warning",
        importance: 70,
        createdAt: now,
        icon: "bitcoin",
      });
    }
  }

  // Empty state
  if (insights.length === 0) {
    insights.push({
      id: id(),
      title: "All quiet on the financial front",
      body: "Add a few transactions to start receiving intelligent insights about your money.",
      severity: "info",
      importance: 10,
      createdAt: now,
      icon: "sparkles",
    });
  }

  // Keep only top 5 by importance
  return insights.sort((a, b) => b.importance - a.importance).slice(0, 5);

  void nw; // referenced for completeness
};
