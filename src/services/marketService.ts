import type { Market, MarketOrderBook } from "@/lib/types";
import { dreamdexAdapter } from "./dreamdex";

export async function getLiveMarkets(): Promise<Market[]> {
  return dreamdexAdapter.discoverMarkets();
}

export async function getMarket(id: string): Promise<Market> {
  return dreamdexAdapter.getMarketOnchain(id);
}
export async function getMarketStatus(id: string) {
  return dreamdexAdapter.getSettlementStatus(id);
}
export async function getMarketOrderBook(id: string): Promise<MarketOrderBook> {
  return dreamdexAdapter.getOrderBook(id);
}
