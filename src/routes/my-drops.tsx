import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/dreamdrop/AppShell";
import { PredictionTicket } from "@/components/dreamdrop/PredictionTicket";
import {
  CardsSkeleton,
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/dreamdrop/states";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPositions } from "@/services/positionService";
import type { Position } from "@/lib/types";
import { usd } from "@/lib/format";

export const Route = createFileRoute("/my-drops")({
  head: () => ({
    meta: [
      { title: "My drops — DreamDrop" },
      {
        name: "description",
        content:
          "Every prediction you claimed: live positions, cash-out prices, and settled results.",
      },
      { property: "og:title", content: "My drops — DreamDrop" },
      {
        property: "og:description",
        content: "Track live and settled DreamDrop prediction positions.",
      },
    ],
  }),
  component: MyDrops,
});

function PositionTile({ position }: { position: Position }) {
  const settled = ["WON", "LOST", "VOIDED", "REDEEMABLE", "REDEEMED"].includes(position.status);
  return (
    <div>
      <PredictionTicket
        asset={position.asset}
        side={position.side}
        probability={settled ? undefined : position.marketProbability}
        cashout={position.status === "ACTIVE" ? position.cashoutPrice : null}
        expiresAt={position.expiresAt}
        status={position.status === "ACTIVE" ? "LIVE" : position.status}
        soldFor={position.soldFor}
        compact
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {position.status === "WON"
            ? `Redeem ${usd(position.potentialPayout)}`
            : position.status === "LOST"
              ? "Settled $0"
              : position.status === "SOLD"
                ? `Sold for ${usd(position.soldFor ?? 0)}`
                : `From ${position.claimedFrom}`}
        </p>
        <Button asChild size="sm" variant="outline">
          <Link to="/position/$positionId" params={{ positionId: position.id }}>
            Open
          </Link>
        </Button>
      </div>
    </div>
  );
}

function MyDrops() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["positions"],
    queryFn: getPositions,
  });

  const active = data?.filter((p) => p.status === "ACTIVE") ?? [];
  const settled =
    data?.filter((p) => p.status !== "ACTIVE") ?? [];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Recipient"
        title="My drops"
        description="Positions you claimed through DreamDrop."
      />

      <div className="mt-8">
        {isPending ? (
          <CardsSkeleton count={3} />
        ) : isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : (
          <Tabs defaultValue="active">
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="settled">Settled</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            {[
              ["active", active],
              ["settled", settled],
              ["all", data],
            ].map(([key, list]) => (
              <TabsContent key={key as string} value={key as string} className="mt-6">
                {(list as Position[]).length === 0 ? (
                  <EmptyState
                    title="No drops here yet"
                    description="Claim a DreamDrop and your live position will show up here."
                    action={
                      <Button asChild>
                        <Link to="/claim/$code" params={{ code: "demo" }}>
                          Try a demo drop
                        </Link>
                      </Button>
                    }
                  />
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {(list as Position[]).map((position) => (
                      <PositionTile key={position.id} position={position} />
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </AppShell>
  );
}
