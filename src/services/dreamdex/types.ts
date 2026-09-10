import type { Market, MarketOrderBook, MarketStatus } from "@/lib/types";
import type { Address, Hex } from "viem";

export interface OutcomeBalanceInput {
  outcomeToken: Address;
  account: Address;
  tokenId: bigint;
}

export interface MintCompleteSetInput {
  marketId: Hex;
  amountRaw: bigint;
}

export interface MintCompleteSetResult {
  transactionHash: Hex;
  yesBalanceBefore: bigint;
  yesBalanceAfter: bigint;
  noBalanceBefore: bigint;
  noBalanceAfter: bigint;
}

export interface DreamdexAdapter {
  readonly dataSource: "mock" | "live";
  discoverMarkets(): Promise<Market[]>;
  getMarketOnchain(marketId: string): Promise<Market>;
  getOutcomeBalance(input: OutcomeBalanceInput): Promise<bigint>;
  mintCompleteSet(input: MintCompleteSetInput): Promise<MintCompleteSetResult>;
  getOrderBook(marketId: string): Promise<MarketOrderBook>;
  getSettlementStatus(marketId: string): Promise<MarketStatus>;
}
