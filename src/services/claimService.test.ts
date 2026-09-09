import { describe, expect, it } from "vitest";
import { createClaimChallenge, getClaimPreview, submitClaim } from "./claimService";
describe("claim privacy and replay protection",()=>{
  it("does not reveal the side in previews",async()=>{const preview=await getClaimPreview("demo");expect(preview).not.toHaveProperty("side");});
  it("prevents a duplicate authorized claim",async()=>{const walletAddress="0x1234567890abcdef";const challenge=await createClaimChallenge({code:"eth-down",walletAddress});await submitClaim({code:"eth-down",walletAddress,challengeId:challenge.id,signature:"0xsigned"});await expect(createClaimChallenge({code:"eth-down",walletAddress})).rejects.toThrow();});
});
