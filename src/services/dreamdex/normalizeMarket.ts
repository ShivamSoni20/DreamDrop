import type { BinaryMarket, MarketOnchain } from "@somnia-chain/markets-sdk";
import { SOMNIA_TESTNET_ADDRESSES } from "@somnia-chain/markets-sdk";
import { hasEnoughCampaignTime } from "@/lib/campaign-rules";
import type { Market, MarketStatus } from "@/lib/types";

const ONCHAIN_STATUSES: readonly MarketStatus[] = [
  "LOCKING",
  "TRADING",
  "LOCKED",
  "RESOLVING",
  "FINALIZED",
  "VOIDED",
];

export function normalizeOnchainStatus(status: number, finalized: boolean): MarketStatus {
  if (finalized) return "FINALIZED";
  return ONCHAIN_STATUSES[status] ?? "EXPIRED";
}

export function normalizeDreamdexMarket(indexed: BinaryMarket, onchain: MarketOnchain): Market {
  const status = normalizeOnchainStatus(onchain.status, onchain.finalized);
  const expiresAt = Number(onchain.expiry) * 1000;
  const intervalSec = Number(indexed.intervalSec);
  const probability =
    indexed.lastPrice === null
      ? 0.5
      : Math.max(0, Math.min(1, Number(indexed.lastPrice) / 10 ** onchain.decimals));
  const collateralSymbol =
    SOMNIA_TESTNET_ADDRESSES.testUsdc &&
    onchain.collateral.toLowerCase() === SOMNIA_TESTNET_ADDRESSES.testUsdc.toLowerCase()
      ? "tUSDC"
      : "TOKEN";

  return {
    id: indexed.marketId,
    marketId: indexed.marketId,
    asset: indexed.asset,
    question: indexed.question,
    strike: indexed.strike,
    intervalSec,
    upProbability: probability,
    downProbability: 1 - probability,
    bestUpCashout: null,
    bestDownCashout: null,
    status,
    liquidity: Number(onchain.backing) > 0 ? "HEALTHY" : "NONE",
    expiresAt,
    collateral: {
      address: onchain.collateral,
      symbol: collateralSymbol,
      decimals: onchain.decimals,
    },
    canCreateCampaign: status === "TRADING" && hasEnoughCampaignTime(expiresAt, intervalSec),
    venueId: indexed.marketId,
    poolAddress: onchain.pool,
    outcomeTokenAddress: onchain.outcomeToken,
    yesTokenId: onchain.yesId.toString(),
    noTokenId: onchain.noId.toString(),
    ...(onchain.isResolved ? { settledSide: onchain.winningOutcome === 0 ? "UP" : "DOWN" } : {}),
  };
}
