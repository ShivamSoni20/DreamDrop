import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { ActivityEvent, Campaign, Market } from "@/lib/types";
import { pct, timeAgo } from "@/lib/format";
import { Countdown, LiveBadge, StatusBadge } from "./primitives";
import { canCreateCampaignForMarket } from "@/lib/campaign-rules";

export function MarketCard({
  market,
  onSelect,
  selected,
  actionLabel = "Select market",
}: {
  market: Market;
  onSelect?: (market: Market) => void;
  selected?: boolean;
  actionLabel?: string;
}) {
  const selectable = canCreateCampaignForMarket(market);
  return (
    <article
      className={`rounded-2xl border bg-card p-5 shadow-soft transition-shadow hover:shadow-lift ${
        selected ? "border-primary ring-2 ring-ring/30" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-sm font-semibold">
            {market.asset}
          </span>
          <LiveBadge />
        </div>
        <span className="text-xs text-muted-foreground">
          Liquidity:{" "}
          <span className="font-medium text-foreground">
            {market.liquidity === "HEALTHY" ? "Healthy" : "Thin"}
          </span>
        </span>
      </div>

      <h3 className="mt-4 text-lg font-semibold">{market.question}</h3>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-up-soft p-3">
          <p className="flex items-center gap-1 text-xs font-semibold text-up">
            <ArrowUp className="size-3.5" aria-hidden="true" /> UP
          </p>
          <p className="mt-1 text-xl font-semibold text-up">{pct(market.upProbability)}</p>
        </div>
        <div className="rounded-xl bg-down-soft p-3">
          <p className="flex items-center gap-1 text-xs font-semibold text-down">
            <ArrowDown className="size-3.5" aria-hidden="true" /> DOWN
          </p>
          <p className="mt-1 text-xl font-semibold text-down">{pct(market.downProbability)}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Ends in</span>
        <Countdown expiresAt={market.expiresAt} className="font-semibold" />
      </div>
      {!selectable ? (
        <>
          <p className="mt-3 text-sm font-medium text-down">Too close to settlement</p>
          <p className="mt-1 text-xs text-muted-foreground">
            This market is ending too soon to create a reliable DreamDrop campaign.
          </p>
        </>
      ) : null}

      {onSelect ? (
        <Button className="mt-4 w-full" disabled={!selectable} onClick={() => onSelect(market)}>
          {actionLabel}
        </Button>
      ) : (
        <Button asChild variant="outline" className="mt-4 w-full">
          <Link to="/create">{actionLabel}</Link>
        </Button>
      )}
    </article>
  );
}

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const claimPct = Math.round((campaign.claimedDrops / campaign.totalDrops) * 100);
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{campaign.name}</h3>
          <p className="text-sm text-muted-foreground">
            {campaign.asset} · {campaign.totalDrops} drops
          </p>
        </div>
        <StatusBadge status={campaign.status} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Claimed</p>
          <p className="font-semibold">{campaign.claimedDrops}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Remaining</p>
          <p className="font-semibold">{campaign.totalDrops - campaign.claimedDrops}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Claim rate</p>
          <p className="font-semibold">{claimPct}%</p>
        </div>
      </div>

      <Progress value={claimPct} className="mt-4" />

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {campaign.status === "LIVE" ? "Ends in " : "Market "}
          {campaign.status === "LIVE" ? null : "settled"}
        </span>
        <Button asChild size="sm" variant="outline">
          <Link to="/dashboard/campaign/$campaignId" params={{ campaignId: campaign.id }}>
            View campaign
          </Link>
        </Button>
      </div>
    </article>
  );
}

export function ActivityItem({ event }: { event: ActivityEvent }) {
  const tone =
    event.kind === "CLAIM"
      ? "bg-accent text-accent-foreground"
      : event.kind === "CASHOUT"
        ? "bg-up-soft text-up"
        : "bg-muted text-muted-foreground";
  return (
    <li className="flex items-center gap-3 py-3">
      <span
        className={`rounded-lg px-2 py-1 text-[0.6rem] font-semibold tracking-widest uppercase ${tone}`}
      >
        {event.kind}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm">{event.text}</span>
      <span className="text-xs text-muted-foreground">{timeAgo(event.at)}</span>
    </li>
  );
}
