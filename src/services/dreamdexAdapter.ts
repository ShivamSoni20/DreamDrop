import type { Market, MarketOrderBook, Position } from "@/lib/types";
export interface DreamdexAdapter {
  discoverMarkets(): Promise<Market[]>;
  getMarketOnchain(id: string): Promise<Market>;
  getOutcomeBalance(positionId: string): Promise<number>;
  mintCompleteSet(marketId: string, amount: number): Promise<string>;
  getOrderBook(id: string): Promise<MarketOrderBook>;
  getExecutableQuote(position: Position): Promise<unknown>;
  sellOutcomePosition(positionId: string, quoteId: string): Promise<string>;
  getSettlementStatus(id: string): Promise<Market["status"]>;
  redeemOutcome(positionId: string): Promise<unknown>;
}
export const dreamdexAdapter: DreamdexAdapter = {
  async discoverMarkets() {
    return (await import("./marketService")).getLiveMarkets();
  },
  async getMarketOnchain(id) {
    return (await import("./marketService")).getMarket(id);
  },
  async getOutcomeBalance() {
    return 1;
  },
  async mintCompleteSet() {
    return `0xmockmint${Date.now()}`;
  },
  async getOrderBook(id) {
    return (await import("./marketService")).getMarketOrderBook(id);
  },
  async getExecutableQuote(p) {
    return (await import("./positionService")).getCashoutQuote(p.id);
  },
  async sellOutcomePosition() {
    return `0xmocksell${Date.now()}`;
  },
  async getSettlementStatus(id) {
    return (await import("./marketService")).getMarketStatus(id);
  },
  async redeemOutcome(id) {
    return (await import("./positionService")).getRedemptionQuote(id);
  },
};
