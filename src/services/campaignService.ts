import type {
  ActivityEvent,
  Campaign,
  CampaignClaim,
  CreateCampaignInput,
  PreparedCampaign,
} from "@/lib/types";
import { calculateCompleteSetDistribution, canCreateCampaignForMarket } from "@/lib/campaign-rules";
import { activity, campaigns, claims, delay, markets } from "./mock-db";
export async function getCampaigns(_walletAddress?: string) {
  return delay([...campaigns]);
}
export async function getCampaign(id: string) {
  const v = campaigns.find((c) => c.id === id);
  if (!v) throw new Error("Campaign not found");
  return delay(v, 300);
}
export async function prepareCampaign(input: CreateCampaignInput): Promise<PreparedCampaign> {
  const market = markets.find((m) => m.id === input.marketId);
  if (!market) throw new Error("Market not found");
  if (!canCreateCampaignForMarket(market))
    throw new Error("This market is ending too soon to create a reliable DreamDrop campaign.");
  return delay({
    ...input,
    ...calculateCompleteSetDistribution(input.budget, input.positionSize),
    collateral: market.collateral,
  });
}
export async function createCampaign(input: CreateCampaignInput): Promise<Campaign> {
  const p = await prepareCampaign(input);
  const m = markets.find((v) => v.id === input.marketId)!;
  const c: Campaign = {
    id: `cmp-${String(campaigns.length + 1).padStart(3, "0")}`,
    name: input.name,
    marketId: input.marketId,
    asset: m.asset,
    collateral: m.collateral,
    budget: input.budget,
    positionSize: input.positionSize,
    totalDrops: p.totalDrops,
    claimedDrops: 0,
    upDistributed: 0,
    downDistributed: 0,
    cashOuts: 0,
    status: "LIVE",
    message: input.message,
    createdAt: Date.now(),
  };
  campaigns.unshift(c);
  return delay(c, 600);
}
export async function getCampaignClaims(campaignId: string): Promise<CampaignClaim[]> {
  return delay(
    claims
      .filter((c) => c.campaignId === campaignId)
      .map((c, i) => ({
        id: `${campaignId}-${i + 1}`,
        campaignId,
        code: c.code,
        claimed: c.status === "ALREADY_CLAIMED",
      })),
  );
}
export async function getCampaignActivity(_campaignId?: string): Promise<ActivityEvent[]> {
  return delay([...activity]);
}
export const getActivity = getCampaignActivity;
