import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { pct, usd } from "@/lib/format";
import type { PositionStatus, Side } from "@/lib/types";
import { Countdown, LiveBadge, SideBadge } from "./primitives";

interface PredictionTicketProps {
  asset: string;
  side?: Side | undefined;
  eyebrow?: string | undefined;
  probability?: number | undefined;
  potentialPayout?: number | undefined;
  cashout?: number | null | undefined;
  expiresAt?: number | undefined;
  sealed?: boolean | undefined;
  status?: PositionStatus | "LIVE" | "SEALED" | "REVEALING" | undefined;
  soldFor?: number | undefined;
  compact?: boolean | undefined;
  className?: string | undefined;
  revealAnimation?: boolean | undefined;
}

export function PredictionTicket({
  asset,
  side,
  eyebrow = "DREAMDROP",
  probability,
  potentialPayout = 1,
  cashout,
  expiresAt,
  sealed = false,
  status = "LIVE",
  soldFor,
  compact = false,
  className,
  revealAnimation = false,
}: PredictionTicketProps) {
  const accent =
    side === "DOWN"
      ? "from-down-soft"
      : side === "UP"
        ? "from-up-soft"
        : "from-accent";

  return (
    <div
      className={cn(
        "ticket-notch overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-lift",
        revealAnimation && "animate-reveal",
        className,
      )}
      style={{ ["--notch-top" as string]: compact ? "58%" : "62%" }}
    >
      <div
        className={cn(
          "bg-gradient-to-br to-card px-5 pt-5 pb-4 sm:px-6",
          accent,
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-[0.65rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            {eyebrow}
          </span>
          {status === "LIVE" && !sealed ? (
            <LiveBadge />
          ) : status !== "LIVE" ? (
            <span className="rounded-full bg-card px-2.5 py-1 text-[0.65rem] font-semibold tracking-widest uppercase">
              {status}
            </span>
          ) : null}
        </div>

        {sealed ? (
          <div className="mt-5 flex flex-col items-center gap-3 py-6 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-brand-gradient text-primary-foreground shadow-brand">
              <Lock className="size-6" aria-hidden="true" />
            </span>
            <p className="text-2xl font-semibold">{asset} · Live market</p>
            <p className="text-sm text-muted-foreground">
              Your side is still hidden.
            </p>
          </div>
        ) : (
          <div className="mt-4">
            <p
              className={cn(
                "font-display font-semibold",
                compact ? "text-2xl" : "text-4xl sm:text-5xl",
              )}
            >
              {asset} {side}{" "}
              <span aria-hidden="true">{side === "UP" ? "↑" : "↓"}</span>
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {side ? <SideBadge side={side} size="sm" /> : null}
              {probability !== undefined ? (
                <span className="rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium">
                  {pct(probability)} market probability
                </span>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <div className="ticket-perforation mx-5 sm:mx-6" />

      <div className="grid gap-4 px-5 py-5 sm:grid-cols-3 sm:px-6">
        <div>
          <p className="text-xs text-muted-foreground">Potential payout</p>
          <p className="font-mono text-lg font-semibold tabular-nums">
            Up to {usd(potentialPayout)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">
            {status === "SOLD" ? "Sold for" : "Cash-out available"}
          </p>
          <p className="font-mono text-lg font-semibold tabular-nums">
            {sealed
              ? "hidden"
              : status === "SOLD" && soldFor !== undefined
                ? usd(soldFor)
                : cashout === null
                  ? "—"
                  : cashout !== undefined
                    ? usd(cashout)
                    : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">
            {status === "LIVE" ? "Market ends in" : "Market"}
          </p>
          <p className="font-mono text-lg font-semibold tabular-nums">
            {status === "LIVE" && expiresAt ? (
              <Countdown expiresAt={expiresAt} />
            ) : (
              "settled"
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
