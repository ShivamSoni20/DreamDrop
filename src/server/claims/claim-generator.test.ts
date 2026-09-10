import { describe, expect, it } from "vitest";
import {
  buildClaimLeaf,
  generateCampaignClaims,
  hashClaimCode,
  verifyMerkleProof,
} from "./claim-generator.server";

describe("server claim generation", () => {
  it("generates equal, unique, provable UP and DOWN claims", () => {
    const generated = generateCampaignClaims({
      campaignId: 7n,
      yesTokenId: 101n,
      noTokenId: 102n,
      amountRaw: 1_000_000n,
      completeSets: 10,
    });
    expect(generated.claims.filter((claim) => claim.side === "UP")).toHaveLength(10);
    expect(generated.claims.filter((claim) => claim.side === "DOWN")).toHaveLength(10);
    expect(new Set(generated.claims.map((claim) => claim.claimCode))).toHaveLength(20);
    expect(new Set(generated.claims.map((claim) => claim.claimCodeHash))).toHaveLength(20);
    for (const claim of generated.claims) {
      expect(hashClaimCode(claim.claimCode)).toBe(claim.claimCodeHash);
      expect(verifyMerkleProof(claim.leafHash, claim.merkleProof, generated.merkleRoot)).toBe(true);
    }
  });

  it("binds every Solidity leaf field", () => {
    const base = {
      campaignId: 7n,
      claimIndex: 2n,
      tokenId: 101n,
      amountRaw: 1_000_000n,
      secret: `0x${"11".repeat(32)}` as const,
    };
    const leaf = buildClaimLeaf(base);
    expect(buildClaimLeaf({ ...base, campaignId: 8n })).not.toBe(leaf);
    expect(buildClaimLeaf({ ...base, claimIndex: 3n })).not.toBe(leaf);
    expect(buildClaimLeaf({ ...base, tokenId: 102n })).not.toBe(leaf);
    expect(buildClaimLeaf({ ...base, amountRaw: 2_000_000n })).not.toBe(leaf);
    expect(buildClaimLeaf({ ...base, secret: `0x${"22".repeat(32)}` })).not.toBe(leaf);
  });
});
