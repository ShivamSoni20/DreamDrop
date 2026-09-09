import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ShieldCheck } from "lucide-react";
import { PredictionTicket } from "@/components/dreamdrop/PredictionTicket";
import { ClaimProgress } from "@/components/dreamdrop/TransactionProgress";
import { Logo } from "@/components/dreamdrop/SiteHeader";
import { MobileBottomAction } from "@/components/dreamdrop/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWallet } from "@/lib/wallet";
import { shortAddress, usd } from "@/lib/format";
import { createClaimChallenge, getClaimPreview, submitClaim } from "@/services/claimService";
import { signClaimAuthorization } from "@/services/walletService";
import type { Position } from "@/lib/types";

export const Route = createFileRoute("/claim/$code")({
  head: () => ({
    meta: [
      { title: "Claim your DreamDrop" },
      {
        name: "description",
        content:
          "Someone sent you a live prediction. Reveal your side, then hold, cash out, or redeem.",
      },
      { property: "og:title", content: "Claim your DreamDrop" },
      {
        property: "og:description",
        content: "Someone sent you a live prediction. No purchase required.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ClaimPage,
});

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-canvas flex min-h-screen flex-col bg-background">
      <header className="flex h-16 items-center justify-center border-b border-border">
        <Logo />
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-8">
        {children}
      </main>
    </div>
  );
}

function ClaimError({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Shell>
      <div className="mt-10 rounded-3xl border border-border bg-card p-8 text-center shadow-soft">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex flex-col gap-2">
          {action}
          <Button asChild variant="ghost">
            <Link to="/explore">Explore live markets</Link>
          </Button>
        </div>
      </div>
    </Shell>
  );
}

function ClaimPage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const wallet = useWallet();
  const [stage, setStage] = useState<
    "sealed" | "wallet" | "claiming" | "revealed" | "failed"
  >("sealed");
  const [progress, setProgress] = useState(0);
  const [position, setPosition] = useState<Position | null>(null);

  const claim = useQuery({
    queryKey: ["claim", code],
    queryFn: () => getClaimPreview(code),
  });

  if (claim.isPending) {
    return (
      <Shell>
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="mt-6 h-64 w-full rounded-3xl" />
        <Skeleton className="mt-6 h-12 w-full" />
      </Shell>
    );
  }

  if (claim.isError || !claim.data) {
    return (
      <ClaimError
        title="We couldn't verify this DreamDrop"
        description="The claim link looks broken. Ask the sender for a fresh one."
      />
    );
  }

  const data = claim.data;

  if (data.status === "ALREADY_CLAIMED") {
    return (
      <ClaimError
        title="This DreamDrop has already been claimed."
        description="Each drop can only be claimed once. Nothing was lost."
      />
    );
  }
  if (data.status === "EXPIRED") {
    return (
      <ClaimError
        title="This prediction market has ended."
        description="The window closed before this drop was claimed."
      />
    );
  }
  if (data.status === "INVALID") {
    return (
      <ClaimError
        title="We couldn't verify this DreamDrop."
        description="This claim code doesn't match any live campaign."
      />
    );
  }

  const runClaim = async () => {
    setStage("claiming");
    setProgress(0);
    try {
      const ticker = setInterval(
        () => setProgress((p) => Math.min(2, p + 1)),
        700,
      );
      const walletAddress = wallet.address ?? "0xdemo0000";
      const challenge = await createClaimChallenge({ code, walletAddress });
      setProgress(1);
      const signature = await signClaimAuthorization(challenge);
      setProgress(2);
      const claimed = await submitClaim({ code, walletAddress, challengeId: challenge.id, signature });
      const created = claimed.position;
      clearInterval(ticker);
      setProgress(3);
      setPosition(created);
      setStage("revealed");
    } catch {
      setStage("failed");
    }
  };

  if (stage === "failed") {
    return (
      <ClaimError
        title="Your position wasn't transferred."
        description="Nothing was lost. You can try claiming again."
        action={<Button onClick={() => void runClaim()}>Try again</Button>}
      />
    );
  }

  if (stage === "revealed" && position) {
    return (
      <Shell>
        <p className="text-center text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          You got
        </p>
        <PredictionTicket
          className="mt-4"
          revealAnimation
          eyebrow={data.campaignName}
          asset={position.asset}
          side={position.side}
          probability={position.marketProbability}
          potentialPayout={position.potentialPayout}
          cashout={position.cashoutPrice}
          expiresAt={position.expiresAt}
        />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Received free through DreamDrop. Market probability is not a
          guaranteed cash-out value.
        </p>

        <MobileBottomAction>
          <div className="flex flex-col gap-2">
            <Button
              size="lg"
              onClick={() =>
                void navigate({
                  to: "/position/$positionId",
                  params: { positionId: position.id },
                })
              }
            >
              Hold
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() =>
                void navigate({
                  to: "/position/$positionId",
                  params: { positionId: position.id },
                  search: { cashout: true },
                })
              }
            >
              Cash out {usd(position.cashoutPrice)}
            </Button>
          </div>
        </MobileBottomAction>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="text-center">
        <p className="text-sm font-medium text-muted-foreground">
          {data.campaignName}
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          Someone sent you a live prediction.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {data.asset} · live market · worth up to{" "}
          <span className="font-semibold text-foreground">
            {usd(data.potentialPayout)}
          </span>
        </p>
      </div>

      <PredictionTicket
        className="mt-6"
        asset={data.asset}
        sealed
        potentialPayout={data.potentialPayout}
        expiresAt={data.expiresAt}
      />

      {stage === "claiming" ? (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <ClaimProgress activeIndex={progress} />
        </div>
      ) : null}

      <MobileBottomAction>
        {stage === "claiming" ? (
          <Button size="lg" className="w-full" disabled>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Claiming…
          </Button>
        ) : wallet.status === "connected" ? (
          <div className="space-y-2">
            <Button size="lg" className="w-full shadow-brand" onClick={() => void runClaim()}>
              Claim DreamDrop
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Sending to {shortAddress(wallet.address ?? "")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Button
              size="lg"
              className="w-full shadow-brand"
              onClick={() => setStage("wallet")}
            >
              Reveal my DreamDrop
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              No purchase required.
            </p>
          </div>
        )}
      </MobileBottomAction>

      <Dialog
        open={stage === "wallet"}
        onOpenChange={(open) => setStage(open ? "wallet" : "sealed")}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Where should we send your prediction?</DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <ShieldCheck className="size-4" aria-hidden="true" />
              Connecting does not spend funds.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {["MetaMask", "WalletConnect", "Other wallet"].map((provider) => (
              <Button
                key={provider}
                variant="outline"
                className="w-full justify-start"
                disabled={wallet.status === "connecting"}
                onClick={async () => {
                  await wallet.connect(provider);
                  setStage("sealed");
                }}
              >
                {provider}
              </Button>
            ))}
            <Button
              className="w-full"
              disabled={wallet.status === "connecting"}
              onClick={async () => {
                await wallet.connect("demo");
                setStage("sealed");
              }}
            >
              {wallet.status === "connecting" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              Use demo wallet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
