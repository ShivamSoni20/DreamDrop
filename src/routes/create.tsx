import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, PartyPopper } from "lucide-react";
import { AppShell } from "@/components/dreamdrop/AppShell";
import { MarketCard } from "@/components/dreamdrop/cards";
import { PredictionTicket } from "@/components/dreamdrop/PredictionTicket";
import { QRCard } from "@/components/dreamdrop/QRCard";
import {
  StepList,
  useSimulatedSteps,
} from "@/components/dreamdrop/TransactionProgress";
import { Countdown, LiveBadge } from "@/components/dreamdrop/primitives";
import {
  CardsSkeleton,
  ErrorState,
  PageHeader,
} from "@/components/dreamdrop/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getLiveMarkets } from "@/services/marketService";
import { createCampaign } from "@/services/campaignService";
import type { Campaign, Market } from "@/lib/types";
import { usd } from "@/lib/format";
import { calculateCompleteSetDistribution, canCreateCampaignForMarket } from "@/lib/campaign-rules";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Create a DreamDrop campaign" },
      {
        name: "description",
        content:
          "Pick a live market, set your budget and side split, then generate QR prediction drops.",
      },
      { property: "og:title", content: "Create a DreamDrop campaign" },
      {
        property: "og:description",
        content: "Fund positions and generate QR prediction drops in four steps.",
      },
    ],
  }),
  component: CreateCampaign,
});

const STEPS = ["Market", "Configure", "Review", "Create"];
const TX_STEPS = [
  "Preparing",
  "Awaiting wallet",
  "Minting positions",
  "Creating campaign",
  "Generating claims",
];

type Filter = "ALL" | "BTC" | "ETH" | "ENDING" | "LIQUIDITY";

function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap gap-2">
      {STEPS.map((step, i) => (
        <li
          key={step}
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
            i === current
              ? "border-primary bg-accent font-medium text-accent-foreground"
              : i < current
                ? "border-transparent bg-up-soft text-up"
                : "border-border text-muted-foreground"
          }`}
        >
          <span className="font-mono text-xs">
            {i < current ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}
          </span>
          {step}
        </li>
      ))}
    </ol>
  );
}

function CreateCampaign() {
  const [step, setStep] = useState(0);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [market, setMarket] = useState<Market | null>(null);
  const [name, setName] = useState("Somnia Hacker Night");
  const [budget, setBudget] = useState(10);
  const [positionSize, setPositionSize] = useState(1);
  const [message, setMessage] = useState(
    "You just received a live BTC prediction from Somnia Hacker Night.",
  );
  const [running, setRunning] = useState(false);
  const [created, setCreated] = useState<Campaign | null>(null);

  const markets = useQuery({ queryKey: ["markets"], queryFn: getLiveMarkets });
  const { index } = useSimulatedSteps(TX_STEPS, running);

  const { completeSets, totalDrops, upDrops, downDrops } = calculateCompleteSetDistribution(budget, positionSize);

  const filtered = (markets.data ?? [])
    .filter((m) =>
      filter === "BTC" ? m.asset === "BTC" : filter === "ETH" ? m.asset === "ETH" : true,
    )
    .sort((a, b) =>
      filter === "ENDING"
        ? a.expiresAt - b.expiresAt
        : filter === "LIQUIDITY"
          ? Number(b.liquidity === "HEALTHY") - Number(a.liquidity === "HEALTHY")
          : 0,
    );

  const launch = async () => {
    if (!market) return;
    setRunning(true);
    const campaign = await createCampaign({
      name,
      marketId: market.id,
      budget,
      positionSize,
      message,
    });
    await new Promise((r) => setTimeout(r, 3600));
    setRunning(false);
    setCreated(campaign);
    setStep(3);
  };

  if (created && step === 3) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl text-center">
          <span className="animate-reveal mx-auto flex size-14 items-center justify-center rounded-full bg-up text-up-foreground">
            <PartyPopper className="size-6" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-3xl font-semibold sm:text-4xl">
            Your DreamDrops are live.
          </h1>
          <p className="mt-3 text-muted-foreground">
            {created.totalDrops} prediction drops · {created.asset} ·{" "}
            {market ? <Countdown expiresAt={market.expiresAt} /> : null} remaining
          </p>

          <div className="mt-8 grid gap-6 text-left lg:grid-cols-[1fr_1fr]">
            <QRCard
              value={`https://dreamdrop.app/claim/demo?c=${created.id}`}
              label="Campaign QR"
              caption="Anyone who scans claims the next available drop."
            />
            <div className="grid gap-3">
              <PredictionTicket
                asset={created.asset}
                side="UP"
                probability={market?.upProbability}
                cashout={market?.bestUpCashout}
                expiresAt={market?.expiresAt}
                compact
              />
              <PredictionTicket
                asset={created.asset}
                side="DOWN"
                probability={market?.downProbability}
                cashout={market?.bestDownCashout}
                expiresAt={market?.expiresAt}
                compact
              />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link
                to="/dashboard/campaign/$campaignId"
                params={{ campaignId: created.id }}
              >
                View campaign
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/claim/$code" params={{ code: "demo" }}>
                Open a claim page
              </Link>
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Create"
        title={
          step === 0
            ? "Choose a live prediction market"
            : step === 1
              ? "Build your DreamDrop"
              : "Ready to drop?"
        }
        description="Mock market data for now — the flow is the real thing."
      />

      <div className="mt-6">
        <Stepper current={step} />
      </div>

      {step === 0 ? (
        <div className="mt-8">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <TabsList className="h-auto flex-wrap justify-start">
              <TabsTrigger value="ALL">All</TabsTrigger>
              <TabsTrigger value="BTC">BTC</TabsTrigger>
              <TabsTrigger value="ETH">ETH</TabsTrigger>
              <TabsTrigger value="ENDING">Ending soon</TabsTrigger>
              <TabsTrigger value="LIQUIDITY">Highest liquidity</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-6">
            {markets.isPending ? (
              <CardsSkeleton count={4} />
            ) : markets.isError ? (
              <ErrorState onRetry={() => void markets.refetch()} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((m) => (
                  <MarketCard
                    key={m.id}
                    market={m}
                    selected={market?.id === m.id}
                    onSelect={(selected) => {
                      if (!canCreateCampaignForMarket(selected)) return;
                      setMarket(selected);
                      setStep(1);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {step === 1 && market ? (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="budget">Campaign budget</Label>
                <Input
                  id="budget"
                  type="number"
                  min={1}
                  value={budget}
                  onChange={(e) => setBudget(Math.max(1, Number(e.target.value)))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">Drop size (positions)</Label>
                <Input
                  id="size"
                  type="number"
                  min={1}
                  value={positionSize}
                  onChange={(e) =>
                    setPositionSize(Math.max(1, Number(e.target.value)))
                  }
                />
              </div>
            </div>

            <div className="space-y-3" aria-labelledby="complete-set-label">
              <Label id="complete-set-label">Complete Set Distribution</Label>
              <div className="grid grid-cols-3 gap-3 rounded-xl bg-surface p-4 text-center">
                <div><p className="text-xs text-muted-foreground">UP</p><p className="font-semibold">{upDrops} Drops</p></div>
                <div><p className="text-xs text-muted-foreground">DOWN</p><p className="font-semibold">{downDrops} Drops</p></div>
                <div><p className="text-xs text-muted-foreground">Split</p><p className="font-semibold">50 / 50</p></div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Campaign message</Label>
              <Textarea
                id="message"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="rounded-xl bg-surface p-5 text-center">
              <p className="text-sm text-muted-foreground">
                {budget} {market.collateral.symbol} campaign budget
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {upDrops} UP + {downDrops} DOWN
              </p>
              <p className="mt-2 text-3xl font-semibold">{totalDrops} DreamDrops</p>
            </div>

            <div className="flex justify-between gap-2">
              <Button variant="ghost" onClick={() => setStep(0)}>
                ← Change market
              </Button>
              <Button onClick={() => setStep(2)}>Continue</Button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Live preview
            </p>
            <PredictionTicket
              className="mt-3"
              eyebrow={name || "DreamDrop"}
              asset={market.asset}
              side="UP"
              probability={market.upProbability}
              cashout={market.bestUpCashout}
              expiresAt={market.expiresAt}
            />
            <p className="mt-4 rounded-xl bg-surface p-4 text-sm text-muted-foreground">
              “{message}”
            </p>
          </div>
        </div>
      ) : null}

      {step === 2 && market ? (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{name}</h2>
              <LiveBadge />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {market.asset} · {market.question}
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-4">
              {[
                ["Campaign budget", `${budget} ${market.collateral.symbol}`],
                ["Position size", String(positionSize)],
                ["Complete sets minted", String(completeSets)],
                ["UP drops", String(upDrops)],
                ["DOWN drops", String(downDrops)],
                ["Total DreamDrops", String(totalDrops)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="text-lg font-semibold">{value}</dd>
                </div>
              ))}
              <div>
                <dt className="text-xs text-muted-foreground">Market ends</dt>
                <dd className="text-lg font-semibold">
                  <Countdown expiresAt={market.expiresAt} />
                </dd>
              </div>
            </dl>

            <div className="mt-6 rounded-xl bg-surface p-5">
              <p className="text-sm font-medium">What happens next</p>
              <div className="mt-3">
                <StepList
                  steps={["Authorize", "Mint positions", "Fund campaign"]}
                  activeIndex={-1}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-between gap-2">
              <Button variant="ghost" onClick={() => setStep(1)}>
                ← Edit configuration
              </Button>
              <Button className="shadow-brand" onClick={() => void launch()}>
                Create {totalDrops} DreamDrops
              </Button>
            </div>
          </div>

          <PredictionTicket
            eyebrow={name || "DreamDrop"}
            asset={market.asset}
            side="DOWN"
            probability={market.downProbability}
            cashout={market.bestDownCashout}
            expiresAt={market.expiresAt}
          />
        </div>
      ) : null}

      <Dialog open={running}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Creating your DreamDrops</DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            <StepList steps={TX_STEPS} activeIndex={index} />
          </div>
          <p className="text-xs text-muted-foreground">
            Nothing is confirmed until every step completes.
          </p>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
