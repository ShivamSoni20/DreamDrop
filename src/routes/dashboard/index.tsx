import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/dreamdrop/AppShell";
import { ActivityItem, CampaignCard } from "@/components/dreamdrop/cards";
import { MetricCard } from "@/components/dreamdrop/primitives";
import {
  CardsSkeleton,
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/dreamdrop/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getActivity, getCampaigns } from "@/services/campaignService";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [
      { title: "Creator dashboard — DreamDrop" },
      {
        name: "description",
        content:
          "Track DreamDrop campaigns, claim rates, distributed positions, and live recipient activity.",
      },
      { property: "og:title", content: "Creator dashboard — DreamDrop" },
      {
        property: "og:description",
        content: "Campaign overview for DreamDrop creators.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const campaigns = useQuery({ queryKey: ["campaigns"], queryFn: () => getCampaigns() });
  const activity = useQuery({ queryKey: ["activity"], queryFn: () => getActivity() });

  const list = campaigns.data ?? [];
  const dropsCreated = list.reduce((sum, c) => sum + c.totalDrops, 0);
  const dropsClaimed = list.reduce((sum, c) => sum + c.claimedDrops, 0);
  const claimRate = dropsCreated
    ? Math.round((dropsClaimed / dropsCreated) * 100)
    : 0;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Good evening"
        title="Campaign overview"
        description="Everything you've funded, dropped, and distributed."
        actions={
          <Button asChild>
            <Link to="/create">
              <Plus className="size-4" aria-hidden="true" />
              Create DreamDrop
            </Link>
          </Button>
        }
      />

      {campaigns.isPending ? (
        <div className="mt-8">
          <CardsSkeleton count={4} />
        </div>
      ) : campaigns.isError ? (
        <div className="mt-8">
          <ErrorState onRetry={() => void campaigns.refetch()} />
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Total campaigns" value={list.length} />
            <MetricCard
              label="Drops created"
              value={dropsCreated}
              spark={[12, 20, 34, 51, 88, dropsCreated]}
            />
            <MetricCard label="Drops claimed" value={dropsClaimed} />
            <MetricCard
              label="Claim rate"
              value={`${claimRate}%`}
              hint={`${dropsClaimed} positions distributed`}
            />
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <section>
              <h2 className="text-xl font-semibold">Campaigns</h2>
              {list.length === 0 ? (
                <div className="mt-4">
                  <EmptyState
                    title="No campaigns yet"
                    description="Fund a live market and DreamDrop will generate the QR claims for you."
                    action={
                      <Button asChild>
                        <Link to="/create">Create DreamDrop</Link>
                      </Button>
                    }
                  />
                </div>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {list.map((campaign) => (
                    <CampaignCard key={campaign.id} campaign={campaign} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-xl font-semibold">Recent activity</h2>
              <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-soft">
                {activity.isPending ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : activity.isError ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Activity unavailable right now.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {activity.data.map((event) => (
                      <ActivityItem key={event.id} event={event} />
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </AppShell>
  );
}
