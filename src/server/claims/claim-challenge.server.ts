import { randomBytes } from "node:crypto";
import { getAddress, recoverTypedDataAddress, type Address, type Hex } from "viem";
import { buildClaimTypedData, type ClaimAuthorizationInput } from "@/lib/claim-authorization";

export interface StoredClaimChallenge extends ClaimAuthorizationInput {
  id: string;
  claimId: string;
  expiresAt: number;
}

export function createStoredClaimChallenge(input: {
  id: string;
  claimId: string;
  campaignId: bigint;
  claimIndex: bigint;
  recipient: Address;
  chainId: number;
  verifyingContract: Address;
  now?: number;
  ttlSeconds?: number;
}): StoredClaimChallenge {
  const now = input.now ?? Date.now();
  const expiresAt = now + (input.ttlSeconds ?? 60) * 1000;
  return {
    id: input.id,
    claimId: input.claimId,
    campaignId: input.campaignId,
    claimIndex: input.claimIndex,
    recipient: getAddress(input.recipient),
    chainId: input.chainId,
    deadline: BigInt(Math.floor(expiresAt / 1000)),
    nonce: BigInt(`0x${randomBytes(32).toString("hex")}`),
    verifyingContract: getAddress(input.verifyingContract),
    expiresAt,
  };
}

export async function verifyStoredClaimChallenge(input: {
  challenge: StoredClaimChallenge;
  signature: Hex;
  wallet: Address;
  expectedChainId: number;
  expectedDistributor: Address;
  now?: number;
}) {
  const { challenge } = input;
  if ((input.now ?? Date.now()) > challenge.expiresAt) throw new Error("Claim challenge expired.");
  if (challenge.chainId !== input.expectedChainId)
    throw new Error("Claim challenge has the wrong chain.");
  if (getAddress(challenge.verifyingContract) !== getAddress(input.expectedDistributor))
    throw new Error("Claim challenge has the wrong Distributor.");
  if (getAddress(challenge.recipient) !== getAddress(input.wallet))
    throw new Error("Claim challenge belongs to a different wallet.");
  const recovered = await recoverTypedDataAddress({
    ...buildClaimTypedData(challenge),
    signature: input.signature,
  });
  if (getAddress(recovered) !== getAddress(challenge.recipient))
    throw new Error("Invalid claim authorization signature.");
  return recovered;
}
