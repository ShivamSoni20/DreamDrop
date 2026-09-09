import type { Market, MarketOrderBook } from "@/lib/types";
import { delay, markets } from "./mock-db";

export async function getLiveMarkets(): Promise<Market[]> {
  return delay(markets.filter((m) => m.status === "TRADING"));
}

export async function getMarket(id: string): Promise<Market> {
  const market = markets.find((m) => m.id === id);
  if (!market) throw new Error("Market not found");
  return delay(market, 300);
}
export async function getMarketStatus(id: string) { return (await getMarket(id)).status; }
export async function getMarketOrderBook(id: string): Promise<MarketOrderBook> { const market = await getMarket(id); return { marketId:id, bids: market.bestUpCashout === null ? [] : [[market.bestUpCashout, 5]], asks:[[Math.min(.99, market.upProbability+.02),5]], updatedAt:Date.now() }; }
