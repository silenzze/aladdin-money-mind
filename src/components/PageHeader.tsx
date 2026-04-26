export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
