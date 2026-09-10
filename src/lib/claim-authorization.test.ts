import { describe, expect, it } from "vitest";
import {
  buildClaimTypedData,
  hashClaimAuthorization,
  serializeClaimTypedData,
} from "./claim-authorization";

const input = {
  campaignId: 12n,
  claimIndex: 3n,
  recipient: "0x1111111111111111111111111111111111111111" as const,
  chainId: 50312,
  deadline: 2_000_000_000n,
  nonce: 44n,
  verifyingContract: "0x2222222222222222222222222222222222222222" as const,
};

describe("DreamDrop claim EIP-712 authorization", () => {
  it("matches the Solidity domain and Claim field order", () => {
    const typedData = buildClaimTypedData(input);
    expect(typedData.domain).toEqual({
      name: "DreamDropDistributor",
      version: "1",
      chainId: 50312,
      verifyingContract: input.verifyingContract,
    });
    expect(typedData.types.Claim.map(({ name, type }) => `${type} ${name}`)).toEqual([
      "uint256 campaignId",
      "uint256 claimIndex",
      "address recipient",
      "uint256 chainId",
      "uint256 deadline",
      "uint256 nonce",
    ]);
    expect(typedData.message.chainId).toBe(50312n);
  });

  it("binds the digest to chain, contract, recipient, claim, deadline, and nonce", () => {
    const digest = hashClaimAuthorization(input);
    for (const changed of [
      { ...input, chainId: 1 },
      { ...input, verifyingContract: "0x3333333333333333333333333333333333333333" as const },
      { ...input, recipient: "0x4444444444444444444444444444444444444444" as const },
      { ...input, claimIndex: 4n },
      { ...input, deadline: input.deadline + 1n },
      { ...input, nonce: input.nonce + 1n },
    ]) {
      expect(hashClaimAuthorization(changed)).not.toBe(digest);
    }
  });

  it("serializes uint256 values for eth_signTypedData_v4", () => {
    const serialized = serializeClaimTypedData(buildClaimTypedData(input));
    expect(JSON.parse(serialized).message).toMatchObject({
      campaignId: "12",
      claimIndex: "3",
      chainId: "50312",
      deadline: "2000000000",
      nonce: "44",
    });
  });
});
