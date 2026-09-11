/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ActivityEvent, Campaign, CampaignClaim, Position } from "@/lib/types";
import type { WalletAccessProof } from "@/lib/access-proof";
import { verifyAccessProof } from "../access-proof.server";
import { getServerEnv } from "../env.server";
import { decryptClaimSecret } from "../claims/secret-box.server";
import {
  findCampaignById,
  findCampaignsByCreator,
} from "../repositories/campaignRepository.server";
import { findClaimsByCampaign } from "../repositories/claimRepository.server";
import {
  findPositionById,
  findPositionsByOwner,
  updatePosition,
} from "../repositories/positionRepository.server";

type Row = any;

async function reconcilePositionRow(row: Row): Promise<Row> {
  if (["SOLD", "REDEEMED"].includes(String(row.status))) return row;
  const { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES } = await import("@somnia-chain/markets-sdk");
  const { somniaTestnet } = await import("viem/chains");
  const env = getServerEnv();
  const exchange = new SomniaMarkets({
    chain: somniaTestnet,
    addresses: SOMNIA_TESTNET_ADDRESSES,
    wsRpcUrl: env.SOMNIA_WS_RPC_URL,
    indexerUrl: env.DREAMDEX_INDEXER_URL,
  });
  const market = await exchange.client.getMarketOnchain(String(row.market_id) as `0x${string}`);
  let status = "ACTIVE";
  if (market.status === 2 || market.status === 3 || (market.status === 4 && !market.finalized)) {
    status = "RESOLVING";
  } else if (market.status === 5) {
    status = market.finalized ? "VOIDED" : "RESOLVING";
  } else if (market.status === 4 && market.finalized) {
    const ownsWinner = market.winningOutcome === (String(row.side) === "UP" ? 0 : 1);
    status = ownsWinner ? "REDEEMABLE" : "LOST";
  } else if (market.status !== 1) {
    status = "RESOLVING";
  }
  return status === row.status ? row : ((await updatePosition(String(row.id), { status })) as Row);
}

function campaignFromRow(row: Row): Campaign {
  const decimals = Number(row.collateral_decimals);
  return {
    id: String(row.id),
    name: String(row.name),
    marketId: String(row.market_id),
    asset: String(row.asset ?? "EVENT"),
    collateral: {
      address: String(row.collateral_address),
      symbol: String(row.collateral_symbol),
      decimals,
    },
    budget: Number(row.budget_raw) / 10 ** decimals,
    positionSize: Number(row.position_size_raw) / 10 ** decimals,
    totalDrops: Number(row.total_drops),
    claimedDrops: Number(row.claimed_drops),
    upDistributed: 0,
    downDistributed: 0,
    cashOuts: 0,
    status: String(row.status) as Campaign["status"],
    message: String(row.message ?? ""),
    createdAt: Date.parse(String(row.created_at)),
    onchainCampaignId: row.onchain_campaign_id ? String(row.onchain_campaign_id) : undefined,
    mintTxHash: row.mint_tx_hash ? String(row.mint_tx_hash) : undefined,
    creationTxHash: row.creation_tx_hash ? String(row.creation_tx_hash) : undefined,
    operatorApprovalTxHash: row.operator_approval_tx_hash
      ? String(row.operator_approval_tx_hash)
      : undefined,
    upFundingTxHash: row.up_funding_tx_hash ? String(row.up_funding_tx_hash) : undefined,
    downFundingTxHash: row.down_funding_tx_hash ? String(row.down_funding_tx_hash) : undefined,
  };
}

function positionFromRow(row: Row): Position {
  const campaign = row.campaigns as Row;
  const decimals = Number(campaign.collateral_decimals);
  const quantity = Number(row.amount_raw) / 10 ** decimals;
  return {
    id: String(row.id),
    campaignId: String(row.campaign_id),
    claimId: String(row.claim_id),
    marketId: String(row.market_id),
    asset: String(campaign.asset ?? "EVENT"),
    side: String(row.side) as Position["side"],
    tokenId: String(row.token_id),
    quantity,
    amountRaw: String(row.amount_raw),
    collateralDecimals: decimals,
    marketProbability: 0,
    cashoutPrice: 0,
    potentialPayout: quantity,
    potentialGrossPayout: quantity,
    status: String(row.status) as Position["status"],
    expiresAt: Date.parse(String(campaign.market_expiry)),
    claimedFrom: String(campaign.name),
    claimedAt: Date.parse(String(row.created_at)),
    claimTx: String(row.claim_tx_hash ?? ""),
    claimTxHash: row.claim_tx_hash ? String(row.claim_tx_hash) : undefined,
    cashoutTxHash: row.cashout_tx_hash ? String(row.cashout_tx_hash) : undefined,
    redemptionTxHash: row.redemption_tx_hash ? String(row.redemption_tx_hash) : undefined,
    soldFor: row.cashout_proceeds_raw
      ? Number(row.cashout_proceeds_raw) / 10 ** decimals
      : undefined,
    cashoutProceedsRaw: row.cashout_proceeds_raw ? String(row.cashout_proceeds_raw) : undefined,
    redemptionProceedsRaw: row.redemption_proceeds_raw
      ? String(row.redemption_proceeds_raw)
      : undefined,
    network: "Somnia Shannon",
    probabilityHistory: [],
  };
}

export async function listCreatorCampaigns(proof: WalletAccessProof) {
  const wallet = await verifyAccessProof(proof, "creator:campaigns");
  const rows = (await findCampaignsByCreator(wallet)) as Row[];
  return rows.map(campaignFromRow);
}

export async function readCreatorCampaign(proof: WalletAccessProof, campaignId: string) {
  const wallet = await verifyAccessProof(proof, `creator:campaign:${campaignId}`);
  const row = (await findCampaignById(campaignId)) as Row | null;
  if (!row || String(row.creator_wallet).toLowerCase() !== wallet.toLowerCase())
    throw new Error("Campaign not found for this creator wallet.");
  const claimRows = (await findClaimsByCampaign(campaignId)) as Row[];
  const decimals = Number(row.collateral_decimals);
  const campaign = campaignFromRow(row);
  campaign.claimedDrops = claimRows.filter((claim) => claim.claimed).length;
  campaign.upDistributed =
    claimRows
      .filter((claim) => claim.claimed && claim.side === "UP")
      .reduce((sum, claim) => sum + Number(claim.amount_raw), 0) /
    10 ** decimals;
  campaign.downDistributed =
    claimRows
      .filter((claim) => claim.claimed && claim.side === "DOWN")
      .reduce((sum, claim) => sum + Number(claim.amount_raw), 0) /
    10 ** decimals;
  const env = getServerEnv();
  const claims: CampaignClaim[] = claimRows.map((claim) => ({
    id: String(claim.id),
    campaignId,
    code: decryptClaimSecret(String(claim.claim_code_ciphertext), env.CLAIM_SIGNING_SECRET),
    claimed: Boolean(claim.claimed),
    side: String(claim.side) as CampaignClaim["side"],
    recipientWallet: claim.recipient_wallet ? String(claim.recipient_wallet) : undefined,
    claimedAt: claim.claimed_at ? Date.parse(String(claim.claimed_at)) : undefined,
    claimTxHash: claim.claim_tx_hash ? String(claim.claim_tx_hash) : undefined,
    claimIndex: Number(claim.claim_index),
  }));
  const activity: ActivityEvent[] = claims
    .filter((claim) => claim.claimedAt)
    .map((claim) => ({
      id: claim.id,
      kind: "CLAIM",
      text: `Drop #${claim.claimIndex} claimed by ${claim.recipientWallet}`,
      at: claim.claimedAt!,
    }));
  return { campaign, claims, activity };
}

export async function listOwnerPositions(proof: WalletAccessProof) {
  const wallet = await verifyAccessProof(proof, "owner:positions");
  const rows = await Promise.all(
    ((await findPositionsByOwner(wallet)) as Row[]).map(reconcilePositionRow),
  );
  return rows.map(positionFromRow);
}

export async function readOwnerPosition(proof: WalletAccessProof, positionId: string) {
  const wallet = await verifyAccessProof(proof, `owner:position:${positionId}`);
  const row = (await findPositionById(positionId)) as Row | null;
  if (!row || String(row.owner_wallet).toLowerCase() !== wallet.toLowerCase())
    throw new Error("Position not found for this wallet.");
  return positionFromRow(await reconcilePositionRow(row));
}

export async function recordOwnerPositionAction(
  proof: WalletAccessProof,
  positionId: string,
  action: "cashout" | "redemption",
  txHash: string,
  proceedsRaw: string,
) {
  const wallet = await verifyAccessProof(proof, `owner:position:${positionId}`);
  const row = (await findPositionById(positionId)) as Row | null;
  if (!row || String(row.owner_wallet).toLowerCase() !== wallet.toLowerCase())
    throw new Error("Position not found for this wallet.");
  const { createPublicClient, http } = await import("viem");
  const { somniaTestnet } = await import("viem/chains");
  const receipt = await createPublicClient({
    chain: somniaTestnet,
    transport: http(getServerEnv().SOMNIA_RPC_URL),
  }).waitForTransactionReceipt({ hash: txHash as `0x${string}` });
  if (receipt.status !== "success") throw new Error("Position action transaction reverted.");
  const values =
    action === "cashout"
      ? { status: "SOLD", cashout_tx_hash: txHash, cashout_proceeds_raw: proceedsRaw }
      : {
          status: "REDEEMED",
          redemption_tx_hash: txHash,
          redemption_proceeds_raw: proceedsRaw,
        };
  return positionFromRow((await updatePosition(positionId, values)) as Row);
}
