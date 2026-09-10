import { describe, expect, it } from "vitest";
import type { BinaryMarket, MarketOnchain } from "@somnia-chain/markets-sdk";
import { normalizeDreamdexMarket, normalizeOnchainStatus } from "./normalizeMarket";

const indexed = {
  marketId: `0x${"1".repeat(64)}`,
  asset: "ETH",
  question: "Will ETH finish up?",
  strike: "250000",
  intervalSec: "300",
  lastPrice: "625000",
} as unknown as BinaryMarket;

const onchain = {
  outcomeToken: `0x${"2".repeat(40)}`,
  yesId: 12n,
  noId: 13n,
  pool: `0x${"3".repeat(40)}`,
  collateral: `0x${"4".repeat(40)}`,
  status: 1,
  backing: 10_000_000n,
  finalized: false,
  expiry: BigInt(Math.floor(Date.now() / 1000) + 3_600),
  decimals: 6,
  winningOutcome: 0,
  isResolved: false,
} as unknown as MarketOnchain;

describe("DreamDEX market normalization", () => {
  it("maps every on-chain lifecycle value and finalization", () => {
    expect([0, 1, 2, 3, 4, 5].map((status) => normalizeOnchainStatus(status, false))).toEqual([
      "LOCKING",
      "TRADING",
      "LOCKED",
      "RESOLVING",
      "FINALIZED",
      "VOIDED",
    ]);
    expect(normalizeOnchainStatus(1, true)).toBe("FINALIZED");
    expect(normalizeOnchainStatus(99, false)).toBe("EXPIRED");
  });

  it("preserves market identity and exact ERC-6909 token ids", () => {
    const market = normalizeDreamdexMarket(indexed, onchain);
    expect(market.id).toBe(indexed.marketId);
    expect(market.poolAddress).toBe(onchain.pool);
    expect(market.outcomeTokenAddress).toBe(onchain.outcomeToken);
    expect(market.yesTokenId).toBe("12");
    expect(market.noTokenId).toBe("13");
    expect(market.upProbability).toBe(0.625);
    expect(market.downProbability).toBe(0.375);
    expect(market.canCreateCampaign).toBe(true);
  });

  it("rejects campaign creation when the market is not trading", () => {
    const market = normalizeDreamdexMarket(indexed, { ...onchain, status: 2 });
    expect(market.status).toBe("LOCKED");
    expect(market.canCreateCampaign).toBe(false);
  });
});
