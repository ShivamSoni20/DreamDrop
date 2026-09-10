import { describe, expect, it } from "vitest";
import {
  calculateCompleteSetDistribution,
  hasEnoughCampaignTime,
  isCashoutQuoteUsable,
  requiredCampaignHeadroom,
} from "./campaign-rules";

describe("DreamDrop business rules", () => {
  it("mints equal complete-set sides", () =>
    expect(calculateCompleteSetDistribution(10, 1)).toEqual({
      completeSets: 10,
      upDrops: 10,
      downDrops: 10,
      totalDrops: 20,
    }));
  it("uses interval-aware campaign headroom", () => {
    expect(requiredCampaignHeadroom(900)).toBe(180);
    expect(requiredCampaignHeadroom(60)).toBe(45);
    expect(hasEnoughCampaignTime(Date.now() + 1_000, 900)).toBe(false);
  });
  it("rejects missing and partial cash-out liquidity", () => {
    const base = {
      id: "q",
      positionId: "p",
      marketProbability: 0.57,
      bestExecutablePrice: 0.54,
      quantityRequested: 1,
      estimatedProceeds: 0.54,
      minimumProceeds: 0.53,
      expiresAt: Date.now() + 8_000,
    };
    expect(isCashoutQuoteUsable({ ...base, executableQuantity: 0, canCashOut: false }, 1)).toBe(
      false,
    );
    expect(isCashoutQuoteUsable({ ...base, executableQuantity: 0.5, canCashOut: true }, 1)).toBe(
      false,
    );
  });
  it("rejects expired quotes", () =>
    expect(
      isCashoutQuoteUsable(
        {
          id: "q",
          positionId: "p",
          marketProbability: 0.57,
          bestExecutablePrice: 0.54,
          quantityRequested: 1,
          executableQuantity: 1,
          estimatedProceeds: 0.54,
          minimumProceeds: 0.53,
          expiresAt: Date.now() - 1,
          canCashOut: true,
        },
        1,
      ),
    ).toBe(false));
});
