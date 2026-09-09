import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, ArrowUp, Check } from "lucide-react";
import { AppShell } from "@/components/dreamdrop/AppShell";
import { PredictionTicket } from "@/components/dreamdrop/PredictionTicket";
import { LiveBadge } from "@/components/dreamdrop/primitives";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { pct, usd } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DreamDrop — Airdrops that are live predictions" },
      {
        name: "description",
        content:
          "Turn your campaign budget into real DreamDEX positions. Give people BTC or ETH predictions they can hold, cash out, or redeem.",
      },
      { property: "og:title", content: "DreamDrop — Airdrops that are live predictions" },
      {
        property: "og:description",
        content:
          "Fund positions, generate QR drops, and hand out live BTC or ETH predictions.",
      },
    ],
  }),
  component: Landing,
});

const HERO_ENDS_AT = () => Date.now() + 8 * 60_000 + 21_000;

function useDriftingProbability(start: number) {
  const [value, setValue] = useState(start);
  useEffect(() => {
    const id = setInterval(() => {
      setValue((prev) => {
        const next = prev + (Math.random() - 0.45) * 0.015;
        return Math.min(0.72, Math.max(0.44, Number(next.toFixed(3))));
      });
    }, 2600);
    return () => clearInterval(id);
  }, []);
  return value;
}

function Landing() {
  const [endsAt] = useState(HERO_ENDS_AT);
  const probability = useDriftingProbability(0.52);
  const cashout = Number((probability - 0.03).toFixed(2));

  return (
    <AppShell>
      {/* HERO */}
      <section className="bg-canvas -mx-4 rounded-none px-4 py-10 sm:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Powered by DreamDEX · Built on Somnia
            </p>
            <h1 className="mt-4 text-4xl leading-[1.05] font-semibold sm:text-5xl lg:text-6xl">
              Airdrops that are{" "}
              <span className="text-brand-gradient">live predictions.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Turn your campaign budget into real DreamDEX positions. Give
              people BTC or ETH predictions they can hold, cash out, or redeem.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="shadow-brand">
                <Link to="/create">Create a DreamDrop</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/claim/$code" params={{ code: "demo" }}>
                  Try a demo drop
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              No purchase required. Recipients own a real position, not points.
            </p>
          </div>

          <div className="relative">
            <div className="mb-3 flex items-center justify-end gap-2">
              <LiveBadge />
              <span className="font-mono text-xs text-muted-foreground">
                {[0.52, 0.55, probability].map((p) => pct(p)).join(" → ")}
              </span>
            </div>
            <PredictionTicket
              eyebrow="Free DreamDrop"
              asset="BTC"
              side="UP"
              probability={probability}
              potentialPayout={1}
              cashout={cashout}
              expiresAt={endsAt}
            />
          </div>
        </div>
      </section>

      {/* CONCEPT */}
      <section className="py-16">
        <h2 className="max-w-3xl text-3xl font-semibold sm:text-4xl">
          Don't ask users to buy their first prediction.{" "}
          <span className="text-brand-gradient">Give them one.</span>
        </h2>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Traditional
            </p>
            <ol className="mt-4 space-y-2">
              {[
                "Connect wallet",
                "Fund wallet",
                "Find market",
                "Understand odds",
                "Pick side",
                "Trade",
              ].map((step, i) => (
                <li
                  key={step}
                  className="flex items-center gap-3 rounded-xl bg-muted px-4 py-2.5 text-sm text-muted-foreground"
                >
                  <span className="font-mono text-xs">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-2xl border border-primary/30 bg-card p-6 shadow-lift">
            <p className="text-xs font-semibold tracking-widest text-primary uppercase">
              DreamDrop
            </p>
            <ol className="mt-4 space-y-3">
              {["Scan", "Claim", "You own a prediction"].map((step, i) => (
                <li
                  key={step}
                  className="flex items-center gap-3 rounded-xl bg-accent px-4 py-4 text-lg font-semibold text-accent-foreground"
                >
                  <span className="flex size-7 items-center justify-center rounded-full bg-brand-gradient text-sm text-primary-foreground">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="mt-5 text-sm text-muted-foreground">
              Three steps, no deposit, and the reward moves with the market.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="scroll-mt-24 py-16">
        <h2 className="text-3xl font-semibold sm:text-4xl">How it works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              n: "01",
              title: "Fund",
              body: "Choose a live DreamDEX Event Contract and your campaign budget.",
            },
            {
              n: "02",
              title: "Drop",
              body: "DreamDrop turns UP and DOWN positions into unique QR claims.",
            },
            {
              n: "03",
              title: "Predict",
              body: "Recipients scan, reveal a live position, then hold, cash out, or redeem.",
            },
          ].map((card) => (
            <article
              key={card.n}
              className="rounded-2xl border border-border bg-card p-6 shadow-soft"
            >
              <p className="font-mono text-sm text-primary">{card.n}</p>
              <h3 className="mt-3 text-xl font-semibold">{card.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{card.body}</p>
            </article>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface p-4 text-sm">
          {[
            "Creator",
            "DreamDrop",
            "QR",
            "Prediction Ticket",
            "Hold / Sell / Redeem",
          ].map((step, i, arr) => (
            <span key={step} className="flex items-center gap-2">
              <span className="rounded-lg bg-card px-3 py-1.5 font-medium shadow-soft">
                {step}
              </span>
              {i < arr.length - 1 ? (
                <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
              ) : null}
            </span>
          ))}
        </div>
      </section>

      <LiveDemo />

      {/* USE CASES */}
      <section id="use-cases" className="scroll-mt-24 py-16">
        <h2 className="text-3xl font-semibold sm:text-4xl">Use cases</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Community giveaways", "Give members live predictions instead of static token rewards."],
            ["Conferences", "Put Prediction Drop QR codes inside attendee packs."],
            ["Creator campaigns", "Give followers opposing sides of the same live market."],
            ["Protocol growth", "Turn incentive budgets into actual DreamDEX participation."],
            ["Watch parties", "Drop BTC or ETH positions before shared market events."],
            ["Social drops", "Send prediction claims directly through links and communities."],
          ].map(([title, body]) => (
            <article
              key={title}
              className="rounded-2xl border border-border bg-card p-6 shadow-soft transition-shadow hover:shadow-lift"
            >
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* WHY */}
      <section className="py-16">
        <h2 className="text-3xl font-semibold sm:text-4xl">Why DreamDrop</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["Own before you trade", "Recipients start with a real position before depositing money."],
            ["Rewards that move", "The reward itself changes value with the market."],
            ["Built-in participation", "Every claimed position gives users a reason to hold, sell, or redeem."],
          ].map(([title, body]) => (
            <article key={title} className="rounded-2xl bg-surface p-6">
              <span className="flex size-9 items-center justify-center rounded-xl bg-brand-gradient text-primary-foreground">
                <Check className="size-4" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* MOCK CAMPAIGN */}
      <section className="py-16">
        <div className="grid gap-8 rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-10 lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold">Somnia Hacker Night</h2>
              <LiveBadge />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">BTC · live market</p>
            <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[
                ["Campaign budget", usd(10)],
                ["DreamDrops", "20"],
                ["Claimed", "14"],
                ["UP distributed", "7"],
                ["DOWN distributed", "7"],
                ["Claim rate", "70%"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="text-lg font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            <Progress value={70} className="mt-6" />
            <p className="mt-2 text-sm text-muted-foreground">14 / 20 claimed</p>
            <Button asChild className="mt-6">
              <Link to="/create">Build a campaign</Link>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <PredictionTicket
              asset="BTC"
              side="UP"
              probability={0.57}
              cashout={0.54}
              expiresAt={endsAt}
              compact
            />
            <PredictionTicket
              asset="BTC"
              side="DOWN"
              probability={0.43}
              cashout={0.4}
              expiresAt={endsAt}
              compact
            />
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="pb-20">
        <div className="rounded-3xl bg-brand-gradient px-6 py-14 text-center text-primary-foreground shadow-brand sm:px-12">
          <h2 className="text-3xl font-semibold sm:text-4xl">
            Turn your next giveaway into a market.
          </h2>
          <p className="mx-auto mt-3 max-w-xl opacity-90">
            Fund positions. Generate drops. Acquire prediction-market users.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-7">
            <Link to="/create">Create your first DreamDrop</Link>
          </Button>
        </div>
      </section>
    </AppShell>
  );
}

function LiveDemo() {
  const [revealed, setRevealed] = useState(false);
  const [endsAt] = useState(HERO_ENDS_AT);
  const probability = useDriftingProbability(0.57);

  return (
    <section className="py-16">
      <h2 className="text-3xl font-semibold sm:text-4xl">Live demo</h2>
      <p className="mt-2 text-muted-foreground">
        Reveal a sealed DreamDrop and see exactly what a recipient sees.
      </p>

      <div className="mt-8 grid gap-6 rounded-3xl border border-border bg-surface p-6 sm:p-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-semibold">BTC</p>
              <p className="text-sm text-muted-foreground">Live Event Contract</p>
            </div>
            <LiveBadge />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-up-soft p-4">
              <p className="flex items-center gap-1 text-sm font-semibold text-up">
                <ArrowUp className="size-4" aria-hidden="true" /> UP
              </p>
              <p className="mt-1 text-2xl font-semibold text-up">
                {pct(probability)}
              </p>
            </div>
            <div className="rounded-xl bg-down-soft p-4">
              <p className="flex items-center gap-1 text-sm font-semibold text-down">
                <ArrowDown className="size-4" aria-hidden="true" /> DOWN
              </p>
              <p className="mt-1 text-2xl font-semibold text-down">
                {pct(1 - probability)}
              </p>
            </div>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Market probability is not a guaranteed cash-out value.
          </p>
        </div>

        <div>
          {revealed ? (
            <div className="animate-reveal">
              <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                You got
              </p>
              <PredictionTicket
                asset="BTC"
                side="UP"
                probability={probability}
                cashout={Number((probability - 0.03).toFixed(2))}
                expiresAt={endsAt}
                className="mt-3"
              />
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button className="flex-1" variant="outline">
                  Hold
                </Button>
                <Button asChild className="flex-1">
                  <Link to="/claim/$code" params={{ code: "demo" }}>
                    Cash out {usd(Number((probability - 0.03).toFixed(2)))}
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <PredictionTicket asset="BTC" sealed expiresAt={endsAt} />
              <Button
                className="mt-4 w-full shadow-brand"
                size="lg"
                onClick={() => setRevealed(true)}
              >
                Reveal demo drop
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
