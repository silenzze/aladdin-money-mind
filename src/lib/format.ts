export const formatCurrency = (amount: number, currency = "USD", maxFraction = 2): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFraction,
  }).format(amount);
};

export const formatCompact = (amount: number, currency = "USD"): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
};

export const formatNumber = (n: number, max = 4): string =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: max }).format(n);

export const formatPercent = (n: number, signed = true): string => {
  const sign = signed && n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
};

export const formatSignedCurrency = (n: number, currency = "USD"): string => {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${formatCurrency(Math.abs(n), currency)}`;
};

export const relativeDay = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff}d ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};
