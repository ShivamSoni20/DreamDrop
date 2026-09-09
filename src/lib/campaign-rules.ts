import { appConfig } from "./config";
import type { CashoutQuote, Market } from "./types";
export function calculateCompleteSetDistribution(budget: number, positionSize: number) { const completeSets = positionSize > 0 ? Math.floor(budget / positionSize) : 0; return { completeSets, upDrops: completeSets, downDrops: completeSets, totalDrops: completeSets * 2 }; }
export function requiredCampaignHeadroom(intervalSec: number) {
  const proportional = Math.floor(intervalSec * appConfig.campaignHeadroomFraction);
  return Math.max(appConfig.campaignHeadroomMinSeconds, proportional);
}
export function hasEnoughCampaignTime(expiresAt: number, intervalSec: number, now = Date.now()) { return expiresAt - now >= requiredCampaignHeadroom(intervalSec) * 1000; }
export function canCreateCampaignForMarket(market: Market, now = Date.now()) { return market.status === "TRADING" && market.canCreateCampaign && hasEnoughCampaignTime(market.expiresAt, market.intervalSec, now); }
export function isCashoutQuoteUsable(quote: CashoutQuote, quantity: number, now = Date.now()) { return quote.canCashOut && quote.bestExecutablePrice !== null && quote.executableQuantity >= quantity && quote.expiresAt > now; }
