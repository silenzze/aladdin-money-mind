import type { CryptoLot, CryptoPrices, CryptoSymbol } from "@/state/types";

export interface CryptoPosition {
  symbol: CryptoSymbol;
  quantity: number;
  costBasis: number; // total fiat invested for current holdings
  averageCost: number; // per unit
  marketValue: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
}

/**
 * FIFO cost basis aggregation. Lots are treated as buys; sells are not modeled in v1.
 * Average cost = totalCost / totalQuantity.
 */
export const computePositions = (lots: CryptoLot[], prices: CryptoPrices): CryptoPosition[] => {
  const symbols: CryptoSymbol[] = ["BTC", "ETH"];
  return symbols
    .map((symbol) => {
      const symLots = lots.filter((l) => l.symbol === symbol);
      const quantity = symLots.reduce((s, l) => s + l.quantity, 0);
      const costBasis = symLots.reduce((s, l) => s + l.quantity * l.pricePerUnit, 0);
      const averageCost = quantity > 0 ? costBasis / quantity : 0;
      const price = prices[symbol] ?? 0;
      const marketValue = quantity * price;
      const unrealizedPnl = marketValue - costBasis;
      const unrealizedPnlPct = costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : 0;
      return { symbol, quantity, costBasis, averageCost, marketValue, unrealizedPnl, unrealizedPnlPct };
    })
    .filter((p) => p.quantity > 0 || true); // keep both for UI even if empty
};

export const totalCryptoValue = (lots: CryptoLot[], prices: CryptoPrices): number =>
  computePositions(lots, prices).reduce((s, p) => s + p.marketValue, 0);

export const totalCryptoInvested = (lots: CryptoLot[]): number =>
  lots.reduce((s, l) => s + l.quantity * l.pricePerUnit, 0);
