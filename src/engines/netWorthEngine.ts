import type { Account, CryptoLot, CryptoPrices, Transaction } from "@/state/types";
import { totalCashBalance } from "./financeEngine";
import { totalCryptoValue } from "./cryptoEngine";

export interface NetWorthBreakdown {
  cash: number;
  crypto: number;
  total: number;
  cashPct: number;
  cryptoPct: number;
}

export const computeNetWorth = (
  accounts: Account[],
  lots: CryptoLot[],
  prices: CryptoPrices,
): NetWorthBreakdown => {
  const cash = totalCashBalance(accounts);
  const crypto = totalCryptoValue(lots, prices);
  const total = cash + crypto;
  return {
    cash,
    crypto,
    total,
    cashPct: total > 0 ? (cash / total) * 100 : 0,
    cryptoPct: total > 0 ? (crypto / total) * 100 : 0,
  };
};

/**
 * Reconstruct historical net worth points by replaying transactions backward.
 * Crypto value held constant at current price for simplicity (deterministic).
 */
export const netWorthSeries = (
  accounts: Account[],
  txs: Transaction[],
  lots: CryptoLot[],
  prices: CryptoPrices,
  days = 30,
): Array<{ date: string; value: number }> => {
  const current = computeNetWorth(accounts, lots, prices).total;
  const points: Array<{ date: string; value: number }> = [];
  const sorted = [...txs].sort((a, b) => +new Date(b.date) - +new Date(a.date));
  let running = current;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i <= days; i++) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    // subtract any tx that happened after this day (going backward)
    while (sorted.length && new Date(sorted[0].date) > day) {
      const t = sorted.shift()!;
      if (t.type === "income") running -= t.amount;
      else if (t.type === "expense") running += t.amount;
      // investment & transfer don't change net worth (just move between buckets)
    }
    points.unshift({ date: day.toISOString(), value: Math.max(0, running) });
  }
  return points;
};
