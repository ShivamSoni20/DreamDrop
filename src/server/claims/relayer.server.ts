import {
  createPublicClient,
  createWalletClient,
  decodeEventLog,
  getAddress,
  http,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { somniaTestnet } from "viem/chains";
import type { ClaimedDrop, Position } from "@/lib/types";
import { getServerEnv } from "../env.server";
import {
  completeClaim,
  findClaimByCodeHash,
  findClaimById,
  reserveClaim,
} from "../repositories/claimRepository.server";
import { findPositionByClaim, insertPosition } from "../repositories/positionRepository.server";
import { findRelayerRequest, updateRelayerRequest } from "../repositories/relayerRepository.server";
import { verifyStoredClaimChallenge, type StoredClaimChallenge } from "./claim-challenge.server";
import { hashClaimCode } from "./claim-generator.server";
import { decryptClaimSecret } from "./secret-box.server";

const distributorAbi = [
  {
    type: "function",
    name: "claim",
    stateMutability: "nonpayable",
    inputs: [
      { name: "campaignId", type: "uint256" },
      { name: "claimIndex", type: "uint256" },
      { name: "tokenId", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "secret", type: "bytes32" },
      { name: "proof", type: "bytes32[]" },
      { name: "recipient", type: "address" },
      { name: "deadline", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "event",
    name: "DropClaimed",
    inputs: [
      { indexed: true, name: "campaignId", type: "uint256" },
      { indexed: true, name: "claimIndex", type: "uint256" },
      { indexed: true, name: "recipient", type: "address" },
      { indexed: false, name: "tokenId", type: "uint256" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
  },
] as const;
const erc6909Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "id", type: "uint256" },
    ],
    outputs: [{ name: "amount", type: "uint256" }],
  },
] as const;

interface CampaignRow {
  id: string;
  name: string;
  asset: string | null;
  market_id: string;
  market_expiry: string;
  collateral_decimals: number;
  onchain_campaign_id: string;
}
interface ClaimRow {
  id: string;
  claim_index: number;
  token_id: string;
  amount_raw: string;
  side: "UP" | "DOWN";
  claimed: boolean;
  recipient_wallet: string | null;
  claim_tx_hash: string | null;
  claim_code_hash: string;
  secret_ciphertext: string;
  merkle_proof: Hex[];
  campaigns: CampaignRow;
}
interface RequestRow {
  id: string;
  claim_id: string;
  wallet: string;
  nonce: string;
  deadline: string;
  status: string;
  tx_hash: string | null;
  used_at: string | null;
}

function toResult(claim: ClaimRow, positionRow: Record<string, unknown>): ClaimedDrop {
  const quantity = Number(claim.amount_raw) / 10 ** claim.campaigns.collateral_decimals;
  const tx = String(positionRow["claim_tx_hash"] ?? claim.claim_tx_hash ?? "");
  const position: Position = {
    id: String(positionRow["id"]),
    campaignId: claim.campaigns.id,
    claimId: claim.id,
    marketId: claim.campaigns.market_id,
    asset: claim.campaigns.asset ?? "EVENT",
    side: claim.side,
    tokenId: claim.token_id,
    quantity,
    marketProbability: 0,
    cashoutPrice: 0,
    potentialPayout: quantity,
    potentialGrossPayout: quantity,
    status: "ACTIVE",
    expiresAt: Date.parse(claim.campaigns.market_expiry),
    claimedFrom: claim.campaigns.name,
    claimedAt: Date.parse(String(positionRow["created_at"] ?? new Date().toISOString())),
    claimTx: tx,
    claimTxHash: tx,
    network: "Somnia Shannon",
    probabilityHistory: [],
  };
  return {
    claimId: claim.id,
    positionId: position.id,
    side: claim.side,
    quantity,
    transactionHash: tx,
    status: "CONFIRMED",
    position,
  };
}

export async function relayLiveClaim(input: {
  code: string;
  challengeId: string;
  walletAddress: string;
  signature: string;
}): Promise<ClaimedDrop> {
  const env = getServerEnv();
  const recipient = getAddress(input.walletAddress);
  const request = (await findRelayerRequest(input.challengeId)) as unknown as RequestRow | null;
  if (!request) throw new Error("Claim challenge not found.");
  const claim = (await findClaimById(request.claim_id)) as unknown as ClaimRow | null;
  const byCode = (await findClaimByCodeHash(
    hashClaimCode(input.code),
  )) as unknown as ClaimRow | null;
  if (!claim || !byCode || byCode.id !== claim.id)
    throw new Error("Claim code does not match this challenge.");
  if (request.status === "CONFIRMED" && claim.claimed) {
    const existing = (await findPositionByClaim(claim.id)) as unknown as Record<
      string,
      unknown
    > | null;
    if (!existing) throw new Error("Confirmed claim is missing its position record.");
    return toResult(claim, existing);
  }
  if (request.used_at || request.status !== "PENDING")
    throw new Error("Claim challenge has already been used.");

  const challenge: StoredClaimChallenge = {
    id: request.id,
    claimId: claim.id,
    campaignId: BigInt(claim.campaigns.onchain_campaign_id),
    claimIndex: BigInt(claim.claim_index),
    recipient,
    chainId: 50312,
    deadline: BigInt(Math.floor(Date.parse(request.deadline) / 1000)),
    nonce: BigInt(request.nonce),
    verifyingContract: env.DREAMDROP_DISTRIBUTOR_ADDRESS as Address,
    expiresAt: Date.parse(request.deadline),
  };
  await verifyStoredClaimChallenge({
    challenge,
    signature: input.signature as Hex,
    wallet: recipient,
    expectedChainId: 50312,
    expectedDistributor: env.DREAMDROP_DISTRIBUTOR_ADDRESS as Address,
  });
  const reserved = await reserveClaim(
    claim.id,
    request.id,
    new Date(Date.now() + 120_000).toISOString(),
  );
  if (!reserved) throw new Error("This DreamDrop is being claimed by another request.");
  await updateRelayerRequest(request.id, { status: "RESERVED", signature: input.signature });

  const account = privateKeyToAccount(env.RELAYER_PRIVATE_KEY as Hex);
  const transport = http(env.SOMNIA_RPC_URL);
  const publicClient = createPublicClient({ chain: somniaTestnet, transport });
  const walletClient = createWalletClient({ account, chain: somniaTestnet, transport });
  const tokenId = BigInt(claim.token_id);
  const amount = BigInt(claim.amount_raw);
  const outcomeToken = (
    claim as unknown as { campaigns: CampaignRow & { outcome_token_address: Address } }
  ).campaigns.outcome_token_address;
  const before = await publicClient.readContract({
    address: outcomeToken,
    abi: erc6909Abi,
    functionName: "balanceOf",
    args: [recipient, tokenId],
  });
  const args = [
    challenge.campaignId,
    challenge.claimIndex,
    tokenId,
    amount,
    decryptClaimSecret(claim.secret_ciphertext, env.CLAIM_SIGNING_SECRET) as Hex,
    claim.merkle_proof,
    recipient,
    challenge.deadline,
    challenge.nonce,
    input.signature as Hex,
  ] as const;
  const simulation = await publicClient.simulateContract({
    address: challenge.verifyingContract,
    abi: distributorAbi,
    functionName: "claim",
    args,
    account,
  });
  const hash = await walletClient.writeContract(simulation.request);
  await updateRelayerRequest(request.id, { status: "SUBMITTED", tx_hash: hash });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error(`Claim transaction reverted: ${hash}`);
  const event = receipt.logs.some((log) => {
    try {
      const decoded = decodeEventLog({ abi: distributorAbi, data: log.data, topics: log.topics });
      return (
        decoded.eventName === "DropClaimed" &&
        decoded.args.campaignId === challenge.campaignId &&
        decoded.args.claimIndex === challenge.claimIndex &&
        getAddress(decoded.args.recipient) === recipient &&
        decoded.args.tokenId === tokenId &&
        decoded.args.amount === amount
      );
    } catch {
      return false;
    }
  });
  if (!event) throw new Error("Confirmed receipt is missing the expected DropClaimed event.");
  const after = await publicClient.readContract({
    address: outcomeToken,
    abi: erc6909Abi,
    functionName: "balanceOf",
    args: [recipient, tokenId],
  });
  if (after - before !== amount)
    throw new Error("Recipient ERC-6909 balance delta does not match the claim.");
  await completeClaim(claim.id, {
    recipient_wallet: recipient,
    claim_tx_hash: hash,
    claimed_at: new Date().toISOString(),
  });
  const position = await insertPosition({
    campaign_id: claim.campaigns.id,
    claim_id: claim.id,
    owner_wallet: recipient,
    market_id: claim.campaigns.market_id,
    token_id: claim.token_id,
    side: claim.side,
    amount_raw: claim.amount_raw,
    status: "ACTIVE",
    claim_tx_hash: hash,
  });
  await updateRelayerRequest(request.id, {
    status: "CONFIRMED",
    used_at: new Date().toISOString(),
  });
  return toResult(
    { ...claim, claimed: true, recipient_wallet: recipient, claim_tx_hash: hash },
    position as unknown as Record<string, unknown>,
  );
}
