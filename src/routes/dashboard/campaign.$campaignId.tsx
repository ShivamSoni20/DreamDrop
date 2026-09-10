import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/dreamdrop/AppShell";
import { QRCard } from "@/components/dreamdrop/QRCard";
import {
  Countdown,
  LiveBadge,
  MetricCard,
  SideBadge,
  StatusBadge,
} from "@/components/dreamdrop/primitives";
import { CardsSkeleton, ErrorState, PageHeader } from "@/components/dreamdrop/states";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCampaign } from "@/services/campaignService";
import { getMarket } from "@/services/marketService";
import { usd } from "@/lib/format";

export const Route = createFileRoute("/dashboard/campaign/$campaignId")({
  head: () => ({
    meta: [
      { title: "Campaign detail — DreamDrop" },
      {
        name: "description",
        content:
          "Claim progress, distributed sides, cash-outs, and QR distribution for a DreamDrop campaign.",
      },
      { property: "og:title", content: "Campaign detail — DreamDrop" },
      {
        property: "og:description",
        content: "Live claim analytics for your DreamDrop campaign.",
      },
    ],
  }),
  component: CampaignDetail,
});

const recentClaims = [
  { drop: "#07", side: "UP" as const, wallet: "0x71…39", ago: "2m ago" },
  { drop: "#08", side: "DOWN" as const, wallet: "0x82…18", ago: "4m ago" },
  { drop: "#09", side: "UP" as const, wallet: "0x2f…c1", ago: "7m ago" },
  { drop: "#10", side: "DOWN" as const, wallet: "0xa9…7b", ago: "11m ago" },
];

function CampaignDetail() {
  const { campaignId } = Route.useParams();
  const campaign = useQuery({
    queryKey: ["campaign", campaignId],
    queryFn: () => getCampaign(campaignId),
  });
  const market = useQuery({
    queryKey: ["market", campaign.data?.marketId],
    queryFn: () => getMarket(campaign.data!.marketId),
    enabled: Boolean(campaign.data),
  });

  if (campaign.isPending) {
    return (
      <AppShell>
        <CardsSkeleton count={4} />
      </AppShell>
    );
  }

  if (campaign.isError || !campaign.data) {
    return (
      <AppShell>
        <ErrorState
          title="Campaign not found"
          description="We couldn't load this campaign. It may have been removed."
          onRetry={() => void campaign.refetch()}
        />
      </AppShell>
    );
  }

  const c = campaign.data;
  const claimPct = Math.round((c.claimedDrops / c.totalDrops) * 100);
  const claimUrl = `https://dreamdrop.app/claim/demo?c=${c.id}`;

  return (
    <AppShell>
      <PageHeader
        eyebrow={`${c.asset} campaign`}
        title={c.name}
        description={c.message}
        actions={
          <>
            <Button
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(claimUrl);
                toast.success("Campaign link copied");
              }}
            >
              <Copy className="size-4" aria-hidden="true" />
              Copy link
            </Button>
            <Button variant="outline" onClick={() => toast.success("QR pack queued")}>
              <Download className="size-4" aria-hidden="true" />
              QR pack
            </Button>
          </>
        }
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={c.status} />
        {c.status === "LIVE" ? <LiveBadge /> : null}
        {market.data ? (
          <span className="text-sm text-muted-foreground">
            Market ends in{" "}
            <Countdown
              expiresAt={market.data.expiresAt}
              className="font-semibold text-foreground"
            />
          </span>
        ) : null}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Budget" value={usd(c.budget)} />
        <MetricCard label="Total drops" value={c.totalDrops} />
        <MetricCard label="Claimed" value={c.claimedDrops} hint={`${claimPct}% claim rate`} />
        <MetricCard label="Remaining" value={c.totalDrops - c.claimedDrops} />
        <MetricCard label="UP distributed" value={c.upDistributed} />
        <MetricCard label="DOWN distributed" value={c.downDistributed} />
        <MetricCard label="Cash-outs" value={c.cashOuts} />
        <MetricCard label="Position size" value={`${c.positionSize} contract`} />
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Claim progress</h2>
          <span className="text-sm text-muted-foreground">
            {c.claimedDrops} / {c.totalDrops} claimed
          </span>
        </div>
        <Progress value={claimPct} className="mt-4" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-lg font-semibold">Recent claims</h2>
          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead>Drop</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead className="text-right">Claimed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentClaims.map((claim) => (
                <TableRow key={claim.drop}>
                  <TableCell className="font-medium">Drop {claim.drop}</TableCell>
                  <TableCell>
                    <SideBadge side={claim.side} asset={c.asset} size="sm" />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{claim.wallet}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{claim.ago}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>

        <QRCard
          value={claimUrl}
          label="Campaign QR"
          caption="Print it, project it, or drop it in a pack."
        />
      </div>

      <div className="mt-8">
        <Button asChild variant="ghost">
          <Link to="/dashboard">← Back to dashboard</Link>
        </Button>
      </div>
    </AppShell>
  );
}
