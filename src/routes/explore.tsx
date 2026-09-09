import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/dreamdrop/AppShell";
import { MarketCard } from "@/components/dreamdrop/cards";
import {
  CardsSkeleton,
  ErrorState,
  PageHeader,
} from "@/components/dreamdrop/states";
import { getLiveMarkets } from "@/services/marketService";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore live markets — DreamDrop" },
      {
        name: "description",
        content:
          "Browse live DreamDEX Event Contracts for BTC and ETH before you fund a DreamDrop campaign.",
      },
      { property: "og:title", content: "Explore live markets — DreamDrop" },
      {
        property: "og:description",
        content: "Live BTC and ETH event contracts powering DreamDrop campaigns.",
      },
    ],
  }),
  component: Explore,
});

function Explore() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["markets"],
    queryFn: getLiveMarkets,
  });

  return (
    <AppShell>
      <PageHeader
        eyebrow="DreamDEX Event Contracts"
        title="Explore live markets"
        description="Short windows on BTC and ETH. Pick one to build a campaign around."
      />

      <div className="mt-8">
        {isPending ? (
          <CardsSkeleton count={4} />
        ) : isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((market) => (
              <MarketCard
                key={market.id}
                market={market}
                actionLabel="View market"
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
