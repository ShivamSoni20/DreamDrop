import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PartyPopper, Share2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { AppShell } from "@/components/dreamdrop/AppShell";
import { PredictionTicket } from "@/components/dreamdrop/PredictionTicket";
import { CashoutDialog } from "@/components/dreamdrop/CashoutDialog";
import { Sparkline, Stat } from "@/components/dreamdrop/primitives";
import {
  CardsSkeleton,
  EmptyState,
  ErrorState,
  MobileBottomAction,
} from "@/components/dreamdrop/states";
import { Button } from "@/components/ui/button";
import { pct, timeAgo, usd } from "@/lib/format";
import { cashOutPosition, getPosition, redeemPosition } from "@/services/positionService";
import { useWallet } from "@/lib/wallet";
import { appConfig } from "@/lib/config";
import type { Position } from "@/lib/types";

const searchSchema = z.object({
  cashout: z.boolean().optional(),
});

export const Route = createFileRoute("/position/$positionId")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Your position — DreamDrop" },
      {
        name: "description",
        content:
          "Live probability, cash-out price, and settlement status for your claimed DreamDrop position.",
      },
      { property: "og:title", content: "Your position — DreamDrop" },
      {
        property: "og:description",
        content: "Hold, cash out, or redeem your DreamDrop prediction.",
      },
    ],
  }),
  component: PositionDetail,
});

function PositionDetail() {
  const wallet = useWallet();
  const { positionId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [cashoutOpen, setCashoutOpen] = useState(Boolean(search.cashout));
  const [soldResult, setSoldResult] = useState<Position | null>(null);
  const [redeemedResult, setRedeemedResult] = useState<Position | null>(null);

  const position = useQuery({
    queryKey: ["position", positionId, wallet.address],
    queryFn: () => getPosition(positionId, wallet.address ?? undefined),
    enabled: appConfig.dataMode === "mock" || wallet.status === "connected",
  });

  if (appConfig.dataMode === "live" && wallet.status !== "connected") {
    return (
      <AppShell>
        <EmptyState
          title="Connect the recipient wallet"
          description="Connect the wallet that owns this position to view, cash out, or redeem it."
          action={<Button onClick={() => void wallet.connect()}>Connect wallet</Button>}
        />
      </AppShell>
    );
  }

  if (position.isPending) {
    return (
      <AppShell>
        <CardsSkeleton count={3} />
      </AppShell>
    );
  }

  if (position.isError || !position.data) {
    return (
      <AppShell>
        <ErrorState
          title="Position not found"
          description="We couldn't load this position."
          onRetry={() => void position.refetch()}
        />
      </AppShell>
    );
  }

  const p = position.data;

  if (soldResult) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-3xl font-semibold">Position sold.</h1>
          <p className="mt-2 text-muted-foreground">
            {p.asset} {p.side} sold for
          </p>
          <p className="mt-2 text-5xl font-semibold">{usd(soldResult.soldFor ?? 0)}</p>
          <p className="mt-3 font-mono text-xs break-all text-muted-foreground">
            {soldResult.cashoutTxHash}
          </p>
          <div className="mt-8 flex flex-col gap-2">
            {soldResult.cashoutTxHash ? (
              <Button asChild variant="outline">
                <a
                  href={`${appConfig.explorerUrl}/tx/${soldResult.cashoutTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View transaction
                </a>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link to="/explore">Explore more markets</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/my-drops">Back to my drops</Link>
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (redeemedResult) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-3xl font-semibold">Payout redeemed.</h1>
          <p className="mt-2 text-5xl font-semibold">
            {usd(
              redeemedResult.redemptionProceedsRaw &&
                redeemedResult.collateralDecimals !== undefined
                ? Number(redeemedResult.redemptionProceedsRaw) /
                    10 ** redeemedResult.collateralDecimals
                : p.potentialPayout,
            )}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{p.network}</p>
          <p className="mt-3 font-mono text-xs break-all text-muted-foreground">
            {redeemedResult.redemptionTxHash}
          </p>
          <div className="mt-8 flex flex-col gap-2">
            {redeemedResult.redemptionTxHash ? (
              <Button asChild variant="outline">
                <a
                  href={`${appConfig.explorerUrl}/tx/${redeemedResult.redemptionTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View transaction
                </a>
              </Button>
            ) : null}
            <Button asChild variant="ghost">
              <Link to="/my-drops">Back to my drops</Link>
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const settledWon = p.status === "WON" || p.status === "REDEEMABLE";
  const settledLost = p.status === "LOST";
  const resolving = p.status === "RESOLVING";
  const voided = p.status === "VOIDED";

  return (
    <AppShell>
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div>
          {settledWon ? (
            <div className="mb-6 rounded-2xl bg-up-soft p-6 text-center">
              <span className="animate-reveal mx-auto flex size-12 items-center justify-center rounded-full bg-up text-up-foreground">
                <PartyPopper className="size-5" aria-hidden="true" />
              </span>
              <h1 className="mt-4 text-2xl font-semibold text-up">You called it.</h1>
              <p className="mt-1 text-sm">
                {p.asset} {p.side} won. Redeemable {usd(p.potentialPayout)}.
              </p>
            </div>
          ) : null}
          {settledLost ? (
            <div className="mb-6 rounded-2xl border border-border bg-card p-6">
              <h1 className="text-2xl font-semibold">Market settled.</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {p.asset} finished {p.side === "UP" ? "DOWN" : "UP"}. Your {p.asset} {p.side}{" "}
                position settled at $0.
              </p>
            </div>
          ) : null}
          {resolving ? (
            <div className="mb-6 rounded-2xl border border-border bg-card p-6">
              <h1 className="text-2xl font-semibold">Market resolving</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Cash-out is closed while the final outcome is confirmed.
              </p>
            </div>
          ) : null}
          {voided ? (
            <div className="mb-6 rounded-2xl border border-border bg-card p-6">
              <h1 className="text-2xl font-semibold">Market voided</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                This position can be redeemed according to the market’s void rules.
              </p>
            </div>
          ) : null}

          <PredictionTicket
            eyebrow={p.claimedFrom}
            asset={p.asset}
            side={p.side}
            probability={p.status === "ACTIVE" ? p.marketProbability : undefined}
            potentialPayout={p.potentialPayout}
            cashout={p.status === "ACTIVE" ? p.cashoutPrice : null}
            expiresAt={p.expiresAt}
            status={p.status === "ACTIVE" ? "LIVE" : p.status}
            soldFor={p.soldFor}
          />

          <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-soft">
            <p className="text-sm font-medium">Probability timeline</p>
            <Sparkline values={p.probabilityHistory} className="h-16" />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>{pct(p.probabilityHistory[0] ?? 0)}</span>
              <span>{pct(p.probabilityHistory[p.probabilityHistory.length - 1] ?? 0)}</span>
            </div>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
            <Stat label="Quantity" value={p.quantity} />
            <Stat label="Potential payout" value={usd(p.potentialPayout)} />
            <Stat
              label="Market probability"
              value={p.status === "ACTIVE" ? pct(p.marketProbability) : "settled"}
            />
            <Stat
              label="Cash-out available"
              value={p.status === "ACTIVE" ? usd(p.cashoutPrice) : "—"}
            />
          </div>

          <dl className="mt-6 space-y-3 rounded-2xl bg-surface p-6 text-sm">
            {[
              ["Claimed from", p.claimedFrom],
              ["Claimed", timeAgo(p.claimedAt)],
              ["Claim transaction", p.claimTx],
              ["Token ID", p.tokenId],
              ["Network", p.network],
            ].map(([label, value]) => (
              <div key={label} className="flex min-w-0 justify-between gap-4">
                <dt className="shrink-0 text-muted-foreground">{label}</dt>
                <dd className="min-w-0 truncate font-mono text-xs">{value}</dd>
              </div>
            ))}
          </dl>

          <MobileBottomAction>
            <div className="flex flex-col gap-2">
              {p.status === "ACTIVE" ? (
                <>
                  <Button size="lg" className="shadow-brand" onClick={() => setCashoutOpen(true)}>
                    Cash out
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => toast.success("Holding until settlement")}
                  >
                    Hold
                  </Button>
                </>
              ) : null}
              {settledWon || voided ? (
                <Button
                  size="lg"
                  className="shadow-brand"
                  onClick={async () => {
                    setRedeemedResult(await redeemPosition(p.id));
                  }}
                >
                  {voided ? "Redeem position" : "Redeem payout"}
                </Button>
              ) : null}
              {settledLost ? (
                <Button asChild size="lg" variant="outline">
                  <Link to="/explore">Explore DreamDEX</Link>
                </Button>
              ) : null}
              <Button variant="ghost" onClick={() => toast.success("Share link copied")}>
                <Share2 className="size-4" aria-hidden="true" />
                Share drop result
              </Button>
              <Button asChild variant="ghost">
                <Link to="/my-drops">Back to my drops</Link>
              </Button>
            </div>
          </MobileBottomAction>
        </div>
      </div>

      <CashoutDialog
        position={p}
        open={cashoutOpen}
        onOpenChange={(open) => {
          setCashoutOpen(open);
          if (!open && search.cashout) {
            void navigate({
              to: "/position/$positionId",
              params: { positionId },
              search: {},
            });
          }
        }}
        onConfirmed={async (price) => {
          const result = await cashOutPosition(p.id, price);
          setCashoutOpen(false);
          setSoldResult(result);
        }}
      />
    </AppShell>
  );
}
