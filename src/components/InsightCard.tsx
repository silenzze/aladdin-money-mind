import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, AlertCircle, Flame, Zap, PieChart, Bitcoin, Sparkles } from "lucide-react";
import type { Insight } from "@/state/types";

const ICONS: Record<string, LucideIcon> = {
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  "alert-circle": AlertCircle,
  "flame": Flame,
  "zap": Zap,
  "pie-chart": PieChart,
  "bitcoin": Bitcoin,
  "sparkles": Sparkles,
};

export function InsightCard({ insight, index }: { insight: Insight; index: number }) {
  const Icon = ICONS[insight.icon ?? "sparkles"] ?? Sparkles;
  const tone =
    insight.severity === "positive"
      ? "text-success bg-success/10"
      : insight.severity === "warning"
      ? "text-primary bg-primary/15"
      : "text-foreground bg-accent";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.4 }}
      className="bg-gradient-insight relative overflow-hidden rounded-3xl border border-border p-4 shadow-card"
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-5 w-5" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold leading-tight">{insight.title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{insight.body}</p>
        </div>
      </div>
    </motion.div>
  );
}
