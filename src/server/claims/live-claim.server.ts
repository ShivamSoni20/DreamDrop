import { randomUUID } from "node:crypto";
import { getAddress, hashTypedData, type Address } from "viem";
import { buildClaimTypedData, serializeClaimTypedData } from "@/lib/claim-authorization";
import type { ClaimChallenge, ClaimPreview } from "@/lib/types";
import { getServerEnv } from "../env.server";
import { findClaimByCodeHash } from "../repositories/claimRepository.server";
import { insertRelayerRequest } from "../repositories/relayerRepository.server";
import { createStoredClaimChallenge } from "./claim-challenge.server";
import { hashClaimCode } from "./claim-generator.server";

interface CampaignRow {
  id: string;
  name: string;
  asset: string | null;
  message: string;
  market_expiry: string;
  status: string;
  onchain_campaign_id: string | null;
  collateral_decimals: number;
}

interface ClaimRow {
  id: string;
  claim_index: number;
  amount_raw: string;
  claimed: boolean;
  campaigns: CampaignRow;
}

async function resolveClaim(code: string): Promise<ClaimRow | null> {
  if (!code) return null;
  return (await findClaimByCodeHash(hashClaimCode(code))) as unknown as ClaimRow | null;
}

export async function getLiveClaimPreview(code: string): Promise<ClaimPreview> {
  const claim = await resolveClaim(code);
  if (!claim)
    return {
      code,
      campaignId: "",
      campaignName: "",
      asset: "BTC",
      potentialPayout: 0,
      expiresAt: Date.now(),
      status: "INVALID",
      message: "",
    };
  const campaign = claim.campaigns;
  const expiresAt = Date.parse(campaign.market_expiry);
  const status = claim.claimed
    ? "ALREADY_CLAIMED"
    : expiresAt <= Date.now() || campaign.status !== "LIVE"
      ? "EXPIRED"
      : "AVAILABLE";
  return {
    code,
    campaignId: campaign.id,
    campaignName: campaign.name,
    asset: campaign.asset ?? "EVENT",
    potentialPayout: Number(claim.amount_raw) / 10 ** campaign.collateral_decimals,
    expiresAt,
    status,
    message: campaign.message,
  };
}

export async function createLiveClaimChallenge(input: {
  code: string;
  walletAddress: string;
}): Promise<ClaimChallenge> {
  const recipient = getAddress(input.walletAddress) as Address;
  const claim = await resolveClaim(input.code);
  if (!claim || claim.claimed || claim.campaigns.status !== "LIVE")
    throw new Error("This DreamDrop can no longer be claimed.");
  const campaignId = claim.campaigns.onchain_campaign_id;
  if (!campaignId) throw new Error("Campaign has not been confirmed on-chain.");
  const env = getServerEnv();
  const challenge = createStoredClaimChallenge({
    id: randomUUID(),
    claimId: claim.id,
    campaignId: BigInt(campaignId),
    claimIndex: BigInt(claim.claim_index),
    recipient,
    chainId: 50312,
    verifyingContract: env.DREAMDROP_DISTRIBUTOR_ADDRESS as Address,
  });
  const typedData = buildClaimTypedData(challenge);
  await insertRelayerRequest({
    id: challenge.id,
    claim_id: claim.id,
    wallet: recipient,
    nonce: challenge.nonce.toString(),
    challenge: hashTypedData(typedData),
    deadline: new Date(challenge.expiresAt).toISOString(),
    status: "PENDING",
    typed_data: JSON.parse(serializeClaimTypedData(typedData)),
  });
  return {
    id: challenge.id,
    code: input.code,
    walletAddress: recipient,
    expiresAt: challenge.expiresAt,
    message: `Authorize this DreamDrop claim for ${recipient} on Somnia Shannon (50312).`,
    typedData,
  };
}
