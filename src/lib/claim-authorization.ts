import { hashTypedData, type Address, type Hex } from "viem";

export const DREAMDROP_CLAIM_DOMAIN_NAME = "DreamDropDistributor";
export const DREAMDROP_CLAIM_DOMAIN_VERSION = "1";

export const dreamdropClaimTypes = {
  Claim: [
    { name: "campaignId", type: "uint256" },
    { name: "claimIndex", type: "uint256" },
    { name: "recipient", type: "address" },
    { name: "chainId", type: "uint256" },
    { name: "deadline", type: "uint256" },
    { name: "nonce", type: "uint256" },
  ],
} as const;

export interface ClaimAuthorizationInput {
  campaignId: bigint;
  claimIndex: bigint;
  recipient: Address;
  chainId: number;
  deadline: bigint;
  nonce: bigint;
  verifyingContract: Address;
}

export function buildClaimTypedData(input: ClaimAuthorizationInput) {
  return {
    domain: {
      name: DREAMDROP_CLAIM_DOMAIN_NAME,
      version: DREAMDROP_CLAIM_DOMAIN_VERSION,
      chainId: input.chainId,
      verifyingContract: input.verifyingContract,
    },
    types: dreamdropClaimTypes,
    primaryType: "Claim" as const,
    message: {
      campaignId: input.campaignId,
      claimIndex: input.claimIndex,
      recipient: input.recipient,
      chainId: BigInt(input.chainId),
      deadline: input.deadline,
      nonce: input.nonce,
    },
  } as const;
}

export type ClaimTypedData = ReturnType<typeof buildClaimTypedData>;

export function hashClaimAuthorization(input: ClaimAuthorizationInput): Hex {
  return hashTypedData(buildClaimTypedData(input));
}

export function serializeClaimTypedData(typedData: ClaimTypedData) {
  return JSON.stringify(typedData, (_key, value) =>
    typeof value === "bigint" ? value.toString() : value,
  );
}
