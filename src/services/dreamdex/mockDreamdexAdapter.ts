import type { MarketOrderBook } from "@/lib/types";
import { delay, markets } from "../mock-db";
import type { DreamdexAdapter } from "./types";

export function createMockDreamdexAdapter(): DreamdexAdapter {
  return {
    dataSource: "mock",
    async discoverMarkets() {
      return delay(markets.filter((market) => market.status === "TRADING"));
    },
    async getMarketOnchain(marketId) {
      const market = markets.find((candidate) => candidate.id === marketId);
      if (!market) throw new Error("Market not found");
      return delay(market, 300);
    },
    async getOutcomeBalance() {
      return 1n;
    },
    async mintCompleteSet() {
      return {
        transactionHash: `0x${Date.now().toString(16)}`,
        yesBalanceBefore: 0n,
        yesBalanceAfter: 1n,
        noBalanceBefore: 0n,
        noBalanceAfter: 1n,
      };
    },
    async getOrderBook(marketId): Promise<MarketOrderBook> {
      const market = await this.getMarketOnchain(marketId);
      return {
        marketId,
        bids: market.bestUpCashout === null ? [] : [[market.bestUpCashout, 5]],
        asks: [[Math.min(0.99, market.upProbability + 0.02), 5]],
        updatedAt: Date.now(),
      };
    },
    async getSettlementStatus(marketId) {
      return (await this.getMarketOnchain(marketId)).status;
    },
    async quoteCashout({ quantityRaw }) {
      return {
        limitPriceRaw: 540_000n,
        quantityRaw,
        fillableQuantityRaw: quantityRaw,
        estimatedProceedsRaw: (quantityRaw * 540_000n) / 1_000_000n,
        decimals: 6,
      };
    },
    async executeCashout({ quantityRaw }) {
      return {
        transactionHash: `0x${Date.now().toString(16)}`,
        proceedsRaw: (quantityRaw * 540_000n) / 1_000_000n,
      };
    },
    async redeemPosition() {
      return { transactionHash: `0x${Date.now().toString(16)}`, proceedsRaw: 1_000_000n };
    },
  };
}
