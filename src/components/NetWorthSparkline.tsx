import { useMemo } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/state/store";
import { netWorthSeries } from "@/engines/netWorthEngine";

export function NetWorthSparkline({ height = 64 }: { height?: number }) {
  const { accounts, transactions, cryptoHoldings, prices } = useAppStore();
  const series = useMemo(
    () => netWorthSeries(accounts, transactions, cryptoHoldings, prices, 30),
    [accounts, transactions, cryptoHoldings, prices],
  );

  const values = series.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 320;
  const h = height;
  const points = series
    .map((p, i) => {
      const x = (i / Math.max(1, series.length - 1)) * w;
      const y = h - ((p.value - min) / range) * (h - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const last = values[values.length - 1] ?? 0;
  const first = values[0] ?? 0;
  const up = last >= first;

  return (
    <motion.svg
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      viewBox={`0 0 ${w} ${h}`}
      className="h-16 w-full"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={up ? "oklch(0.82 0.17 75)" : "oklch(0.65 0.22 25)"} stopOpacity="0.35" />
          <stop offset="100%" stopColor={up ? "oklch(0.82 0.17 75)" : "oklch(0.65 0.22 25)"} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={up ? "oklch(0.82 0.17 75)" : "oklch(0.65 0.22 25)"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <polygon fill="url(#sparkFill)" points={`0,${h} ${points} ${w},${h}`} />
    </motion.svg>
  );
}
