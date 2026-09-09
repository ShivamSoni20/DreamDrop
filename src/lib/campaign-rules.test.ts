import { describe, expect, it } from "vitest";
import { calculateCompleteSetDistribution, hasEnoughCampaignTime, isCashoutQuoteUsable } from "./campaign-rules";

describe("DreamDrop business rules", () => {
  it("mints equal complete-set sides", () => expect(calculateCompleteSetDistribution(10, 1)).toEqual({ completeSets:10, upDrops:10, downDrops:10, totalDrops:20 }));
  it("rejects a market below the expiry threshold", () => expect(hasEnoughCampaignTime(Date.now()+1_000)).toBe(false));
  it("rejects missing and partial cash-out liquidity", () => { const base={id:"q",positionId:"p",marketProbability:.57,bestExecutablePrice:.54,quantityRequested:1,estimatedProceeds:.54,minimumProceeds:.53,expiresAt:Date.now()+8_000}; expect(isCashoutQuoteUsable({...base,executableQuantity:0,canCashOut:false},1)).toBe(false); expect(isCashoutQuoteUsable({...base,executableQuantity:.5,canCashOut:true},1)).toBe(false); });
  it("rejects expired quotes", () => expect(isCashoutQuoteUsable({id:"q",positionId:"p",marketProbability:.57,bestExecutablePrice:.54,quantityRequested:1,executableQuantity:1,estimatedProceeds:.54,minimumProceeds:.53,expiresAt:Date.now()-1,canCashOut:true},1)).toBe(false));
});
