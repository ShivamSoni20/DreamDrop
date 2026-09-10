import { useEffect, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCountdown, pct, usd } from "@/lib/format";
import type { CampaignStatus, MarketStatus, PositionStatus, Side } from "@/lib/types";

export function LiveBadge({ label = "LIVE" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[0.65rem] font-semibold tracking-widest text-muted-foreground uppercase">
      <span className="animate-live size-1.5 rounded-full bg-live" aria-hidden="true" />
      {label}
    </span>
  );
}

export function SideBadge({
  side,
  asset,
  size = "md",
}: {
  side: Side;
  asset?: string;
  size?: "sm" | "md";
}) {
  const Icon = side === "UP" ? ArrowUp : ArrowDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold",
        side === "UP" ? "bg-up-soft text-up" : "bg-down-soft text-down",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {asset ? `${asset} ${side}` : side}
    </span>
  );
}

export function StatusBadge({
  status,
}: {
  status: CampaignStatus | MarketStatus | PositionStatus;
}) {
  const tone =
    status === "WON" || status === "REDEEMED"
      ? "bg-up-soft text-up"
      : status === "LOST" || status === "FAILED" || status === "VOIDED"
        ? "bg-down-soft text-down"
        : status === "LIVE" || status === "ACTIVE"
          ? "border border-border bg-card text-foreground"
          : "bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[0.65rem] font-semibold tracking-widest uppercase",
        tone,
      )}
    >
      {status}
    </span>
  );
}

export function useCountdown(expiresAt: number) {
  const [remaining, setRemaining] = useState(() => Math.max(0, expiresAt - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setRemaining(Math.max(0, expiresAt - Date.now())), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return remaining;
}

export function Countdown({ expiresAt, className }: { expiresAt: number; className?: string }) {
  const remaining = useCountdown(expiresAt);
  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {remaining === 0 ? "ended" : formatCountdown(remaining)}
    </span>
  );
}

export function ProbabilityDisplay({
  probability,
  label = "Market probability",
  className,
}: {
  probability: number;
  label?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p key={probability} className="animate-tick text-xl font-semibold">
        {pct(probability)}
      </p>
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  spark,
}: {
  label: string;
  value: string | number;
  hint?: string;
  spark?: number[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-2 text-2xl font-semibold sm:text-3xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      {spark ? <Sparkline values={spark} /> : null}
    </div>
  );
}

export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 28 - ((v - min) / range) * 24;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      className={cn("mt-3 h-8 w-full text-primary", className)}
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function MoneyRow({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: number;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={cn("font-mono tabular-nums", emphasis ? "text-lg font-semibold" : "text-sm")}
      >
        {usd(value)}
      </span>
    </div>
  );
}
