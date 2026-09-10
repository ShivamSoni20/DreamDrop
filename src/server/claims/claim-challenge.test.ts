import { describe, expect, it } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import { buildClaimTypedData } from "@/lib/claim-authorization";
import { createStoredClaimChallenge, verifyStoredClaimChallenge } from "./claim-challenge.server";

const recipient = privateKeyToAccount(`0x${"11".repeat(32)}`);
const other = privateKeyToAccount(`0x${"22".repeat(32)}`);
const distributor = `0x${"33".repeat(20)}` as const;

async function fixture() {
  const challenge = createStoredClaimChallenge({
    id: "challenge-id",
    claimId: "claim-id",
    campaignId: 4n,
    claimIndex: 9n,
    recipient: recipient.address,
    chainId: 50312,
    verifyingContract: distributor,
    now: 1_000_000,
  });
  const signature = await recipient.signTypedData(buildClaimTypedData(challenge));
  return { challenge, signature };
}

describe("server claim authorization", () => {
  it("recovers the bound recipient", async () => {
    const { challenge, signature } = await fixture();
    await expect(
      verifyStoredClaimChallenge({
        challenge,
        signature,
        wallet: recipient.address,
        expectedChainId: 50312,
        expectedDistributor: distributor,
        now: 1_001_000,
      }),
    ).resolves.toBe(recipient.address);
  });

  it("rejects expiry, wrong wallet, chain, and Distributor", async () => {
    const { challenge, signature } = await fixture();
    const common = {
      challenge,
      signature,
      wallet: recipient.address,
      expectedChainId: 50312,
      expectedDistributor: distributor,
      now: 1_001_000,
    };
    await expect(
      verifyStoredClaimChallenge({ ...common, now: challenge.expiresAt + 1 }),
    ).rejects.toThrow("expired");
    await expect(verifyStoredClaimChallenge({ ...common, wallet: other.address })).rejects.toThrow(
      "different wallet",
    );
    await expect(verifyStoredClaimChallenge({ ...common, expectedChainId: 1 })).rejects.toThrow(
      "wrong chain",
    );
    await expect(
      verifyStoredClaimChallenge({ ...common, expectedDistributor: other.address }),
    ).rejects.toThrow("wrong Distributor");
  });

  it("rejects a signature made by another wallet", async () => {
    const { challenge } = await fixture();
    const signature = await other.signTypedData(buildClaimTypedData(challenge));
    await expect(
      verifyStoredClaimChallenge({
        challenge,
        signature,
        wallet: recipient.address,
        expectedChainId: 50312,
        expectedDistributor: distributor,
        now: 1_001_000,
      }),
    ).rejects.toThrow("Invalid");
  });
});
