import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div className="min-w-0">
        <h1 className="text-[26px] font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-[14px] text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

type Tone = "primary" | "success" | "warning" | "ai" | "danger" | "muted";
export const toneBg: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning",
  ai: "bg-ai/10 text-ai",
  danger: "bg-danger/10 text-danger",
  muted: "bg-muted text-muted-foreground",
};

export function StatusBadge({ children, tone = "primary" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-full ${toneBg[tone]}`}>
      {children}
    </span>
  );
}

export function MiniStat({
  label,
  value,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  tone?: Tone;
}) {
  return (
    <div className="card-surface p-5">
      <div className="text-[12.5px] text-muted-foreground">{label}</div>
      <div className="mt-1.5 flex items-end gap-2">
        <div className="text-[26px] font-semibold tracking-tight leading-none">{value}</div>
      </div>
      <div className={`mt-3 h-1.5 w-12 rounded-full ${toneBg[tone].split(" ")[0]}`} />
    </div>
  );
}
