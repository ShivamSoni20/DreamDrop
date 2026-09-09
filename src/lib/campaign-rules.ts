import { MIN_CAMPAIGN_TIME_REMAINING_SECONDS } from "./config";
import type { CashoutQuote, Market } from "./types";
export function calculateCompleteSetDistribution(budget: number, positionSize: number) { const completeSets = positionSize > 0 ? Math.floor(budget / positionSize) : 0; return { completeSets, upDrops: completeSets, downDrops: completeSets, totalDrops: completeSets * 2 }; }
export function hasEnoughCampaignTime(expiresAt: number, now = Date.now()) { return expiresAt - now >= MIN_CAMPAIGN_TIME_REMAINING_SECONDS * 1000; }
export function canCreateCampaignForMarket(market: Market, now = Date.now()) { return market.status === "TRADING" && market.canCreateCampaign && hasEnoughCampaignTime(market.expiresAt, now); }
export function isCashoutQuoteUsable(quote: CashoutQuote, quantity: number, now = Date.now()) { return quote.canCashOut && quote.bestExecutablePrice !== null && quote.executableQuantity >= quantity && quote.expiresAt > now; }
