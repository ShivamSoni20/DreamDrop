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
import { CardsSkeleton, EmptyState, ErrorState, PageHeader } from "@/components/dreamdrop/states";
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
import { getCampaign, getCampaignClaims } from "@/services/campaignService";
import { getMarket } from "@/services/marketService";
import { usd } from "@/lib/format";
import { useWallet } from "@/lib/wallet";
import { appConfig } from "@/lib/config";

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

function CampaignDetail() {
  const { campaignId } = Route.useParams();
  const wallet = useWallet();
  const campaign = useQuery({
    queryKey: ["campaign", campaignId, wallet.address],
    queryFn: () => getCampaign(campaignId, wallet.address ?? undefined),
    enabled: appConfig.dataMode === "mock" || wallet.status === "connected",
  });
  const claims = useQuery({
    queryKey: ["campaign-claims", campaignId, wallet.address],
    queryFn: () => getCampaignClaims(campaignId, wallet.address ?? undefined),
    enabled: appConfig.dataMode === "mock" || wallet.status === "connected",
  });
  const market = useQuery({
    queryKey: ["market", campaign.data?.marketId],
    queryFn: () => getMarket(campaign.data!.marketId),
    enabled: Boolean(campaign.data),
  });

  if (appConfig.dataMode === "live" && wallet.status !== "connected") {
    return (
      <AppShell>
        <EmptyState
          title="Connect your creator wallet"
          description="Connect the wallet that owns this campaign to view its analytics and QR links."
          action={<Button onClick={() => void wallet.connect()}>Connect wallet</Button>}
        />
      </AppShell>
    );
  }

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
  const availableClaim = claims.data?.find((claim) => !claim.claimed);
  const claimUrl = availableClaim
    ? `${appConfig.appUrl.replace(/\/$/, "")}/claim/${availableClaim.code}`
    : null;
  const recentClaims = (claims.data ?? [])
    .filter((claim) => claim.claimed)
    .slice(-10)
    .reverse();

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
                if (!claimUrl) {
                  toast.error("No unclaimed link is available.");
                  return;
                }
                await navigator.clipboard.writeText(claimUrl);
                toast.success("Campaign link copied");
              }}
            >
              <Copy className="size-4" aria-hidden="true" />
              Copy link
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Download className="size-4" aria-hidden="true" />
              Print QR pack
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
                <TableRow key={claim.id}>
                  <TableCell className="font-medium">Drop #{claim.claimIndex}</TableCell>
                  <TableCell>
                    <SideBadge side={claim.side!} asset={c.asset} size="sm" />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{claim.recipientWallet}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {claim.claimedAt ? new Date(claim.claimedAt).toLocaleString() : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>

        {claimUrl ? (
          <QRCard value={claimUrl} label="Individual QR" caption="One link, one prediction drop." />
        ) : (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            No individual claim links are available.
          </div>
        )}
      </div>

      {claims.data?.length ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Individual QR pack</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Each code can be claimed once. Distribute each card to one recipient.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-2">
            {claims.data.map((claim) => (
              <QRCard
                key={claim.id}
                value={`${appConfig.appUrl.replace(/\/$/, "")}/claim/${claim.code}`}
                label={`Drop #${claim.claimIndex}`}
                caption={claim.claimed ? "Claimed" : "Available"}
              />
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-8">
        <Button asChild variant="ghost">
          <Link to="/dashboard">← Back to dashboard</Link>
        </Button>
      </div>
    </AppShell>
  );
}
