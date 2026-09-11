import { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES } from "@somnia-chain/markets-sdk";
import {
  createPublicClient,
  decodeEventLog,
  getAddress,
  hashDomain,
  http,
  keccak256,
  stringToBytes,
  type Address,
  type Hex,
  type TransactionReceipt,
} from "viem";
import { somniaTestnet } from "viem/chains";
import { dreamDropDistributorAbi, erc6909Abi } from "@/lib/distributor-abi";
import type { Campaign } from "@/lib/types";
import { getServerEnv } from "../env.server";
import {
  findCampaignByOnchainId,
  insertCampaign,
  updateCampaign,
} from "../repositories/campaignRepository.server";
import { findClaimsByCampaign, insertClaims } from "../repositories/claimRepository.server";
import {
  consumeCampaignPreparation,
  findCampaignPreparation,
  insertCampaignPreparation,
} from "../repositories/campaignPreparationRepository.server";
import { generateCampaignClaims } from "../claims/claim-generator.server";
import { decryptClaimSecret, encryptClaimSecret } from "../claims/secret-box.server";

interface PreparationPayload {
  name: string;
  message: string;
  creator: Address;
  marketId: Hex;
  pool: Address;
  outcomeToken: Address;
  collateral: Address;
  collateralSymbol: string;
  collateralDecimals: number;
  asset: string;
  intervalSec: number;
  marketExpiry: number;
  budgetRaw: string;
  positionSizeRaw: string;
  completeSets: number;
  expectedCampaignId: string;
  merkleRoot: Hex;
  claims: Array<{
    claimIndex: string;
    tokenId: string;
    side: "UP" | "DOWN";
    amountRaw: string;
    secret: Hex;
    secretHash: Hex;
    leafHash: Hex;
    claimCode: string;
    claimCodeHash: string;
    merkleProof: Hex[];
  }>;
}

interface PreparationRow {
  id: string;
  creator_wallet: string;
  expected_onchain_campaign_id: string;
  merkle_root: Hex;
  payload_ciphertext: string;
  expires_at: string;
  consumed_at: string | null;
}

export interface PreparedLiveCampaign {
  preparationId: string;
  expectedCampaignId: string;
  merkleRoot: Hex;
  claimDeadline: number;
  marketId: Hex;
  pool: Address;
  outcomeToken: Address;
  collateral: Address;
  collateralDecimals: number;
  yesTokenId: string;
  noTokenId: string;
  totalUpAmountRaw: string;
  totalDownAmountRaw: string;
  distributorAddress: Address;
}

function createClients() {
  const env = getServerEnv();
  return {
    env,
    publicClient: createPublicClient({ chain: somniaTestnet, transport: http(env.SOMNIA_RPC_URL) }),
  };
}

export async function prepareLiveCampaign(input: {
  creatorWallet: string;
  marketId: string;
  name: string;
  message: string;
  positionSizeRaw: string;
  completeSets: number;
}): Promise<PreparedLiveCampaign> {
  const creator = getAddress(input.creatorWallet);
  const marketId = input.marketId as Hex;
  if (!/^0x[0-9a-fA-F]{64}$/.test(marketId)) throw new Error("Invalid DreamDEX market ID.");
  const positionSizeRaw = BigInt(input.positionSizeRaw);
  if (positionSizeRaw <= 0n || !Number.isSafeInteger(input.completeSets) || input.completeSets <= 0)
    throw new Error("Invalid campaign quantity.");
  const { env, publicClient } = createClients();
  const exchange = new SomniaMarkets({
    chain: somniaTestnet,
    addresses: SOMNIA_TESTNET_ADDRESSES,
    wsRpcUrl: env.SOMNIA_WS_RPC_URL,
    indexerUrl: env.DREAMDEX_INDEXER_URL,
  });
  try {
    const distributorAddress = env.DREAMDROP_DISTRIBUTOR_ADDRESS as Address;
    const [
      indexed,
      onchain,
      expectedCampaignId,
      chainId,
      bytecode,
      domainSeparator,
      claimTypehash,
    ] = await Promise.all([
      exchange.client.getBinaryMarket(marketId),
      exchange.client.getMarketOnchain(marketId),
      publicClient.readContract({
        address: distributorAddress,
        abi: dreamDropDistributorAbi,
        functionName: "nextCampaignId",
      }),
      publicClient.getChainId(),
      publicClient.getCode({ address: distributorAddress }),
      publicClient.readContract({
        address: distributorAddress,
        abi: dreamDropDistributorAbi,
        functionName: "DOMAIN_SEPARATOR",
      }),
      publicClient.readContract({
        address: distributorAddress,
        abi: dreamDropDistributorAbi,
        functionName: "CLAIM_TYPEHASH",
      }),
    ]);
    if (chainId !== 50312 || !bytecode || bytecode === "0x")
      throw new Error("Configured Distributor is not deployed on Somnia Shannon.");
    const expectedDomain = hashDomain({
      domain: {
        name: "DreamDropDistributor",
        version: "1",
        chainId: BigInt(chainId),
        verifyingContract: distributorAddress,
      },
      types: {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
          { name: "chainId", type: "uint256" },
          { name: "verifyingContract", type: "address" },
        ],
      },
    });
    const expectedTypehash = keccak256(
      stringToBytes(
        "Claim(uint256 campaignId,uint256 claimIndex,address recipient,uint256 chainId,uint256 deadline,uint256 nonce)",
      ),
    );
    if (domainSeparator !== expectedDomain || claimTypehash !== expectedTypehash)
      throw new Error("Configured Distributor EIP-712 domain does not match DreamDrop.");
    if (!indexed) throw new Error("DreamDEX market not found.");
    if (onchain.status !== 1 || onchain.finalized)
      throw new Error("DreamDEX market is not Trading.");
    const intervalSec = Number(indexed.intervalSec);
    const headroom = Math.max(45, Math.floor(intervalSec * 0.2));
    if (Number(onchain.expiry) - Math.floor(Date.now() / 1000) < headroom)
      throw new Error("DreamDEX market is ending too soon for campaign creation.");
    if (
      !SOMNIA_TESTNET_ADDRESSES.testUsdc ||
      onchain.collateral.toLowerCase() !== SOMNIA_TESTNET_ADDRESSES.testUsdc.toLowerCase()
    )
      throw new Error("DreamDEX market collateral is not supported.");
    const generated = generateCampaignClaims({
      campaignId: expectedCampaignId,
      yesTokenId: onchain.yesId,
      noTokenId: onchain.noId,
      amountRaw: positionSizeRaw,
      completeSets: input.completeSets,
    });
    const payload: PreparationPayload = {
      name: input.name,
      message: input.message,
      creator,
      marketId,
      pool: onchain.pool,
      outcomeToken: onchain.outcomeToken,
      collateral: onchain.collateral,
      collateralSymbol: "tUSDC",
      collateralDecimals: onchain.decimals,
      asset: indexed.asset,
      intervalSec,
      marketExpiry: Number(onchain.expiry),
      budgetRaw: (positionSizeRaw * BigInt(input.completeSets)).toString(),
      positionSizeRaw: positionSizeRaw.toString(),
      completeSets: input.completeSets,
      expectedCampaignId: expectedCampaignId.toString(),
      merkleRoot: generated.merkleRoot,
      claims: generated.claims.map((claim) => ({
        ...claim,
        claimIndex: claim.claimIndex.toString(),
        tokenId: claim.tokenId.toString(),
        amountRaw: claim.amountRaw.toString(),
      })),
    };
    const expiresAt = Math.min(Number(onchain.expiry) * 1000, Date.now() + 10 * 60_000);
    const row = (await insertCampaignPreparation({
      creator_wallet: creator,
      expected_onchain_campaign_id: expectedCampaignId.toString(),
      merkle_root: generated.merkleRoot,
      payload_ciphertext: encryptClaimSecret(JSON.stringify(payload), env.CLAIM_SIGNING_SECRET),
      expires_at: new Date(expiresAt).toISOString(),
    })) as { id: string };
    const total = (positionSizeRaw * BigInt(input.completeSets)).toString();
    return {
      preparationId: row.id,
      expectedCampaignId: expectedCampaignId.toString(),
      merkleRoot: generated.merkleRoot,
      claimDeadline: Number(onchain.expiry),
      marketId,
      pool: onchain.pool,
      outcomeToken: onchain.outcomeToken,
      collateral: onchain.collateral,
      collateralDecimals: onchain.decimals,
      yesTokenId: onchain.yesId.toString(),
      noTokenId: onchain.noId.toString(),
      totalUpAmountRaw: total,
      totalDownAmountRaw: total,
      distributorAddress: env.DREAMDROP_DISTRIBUTOR_ADDRESS as Address,
    };
  } finally {
    await Promise.race([
      exchange.close(),
      new Promise<void>((resolve) => setTimeout(resolve, 1_000)),
    ]);
  }
}

function decodedEvents(receipt: TransactionReceipt) {
  if (receipt.status !== "success") throw new Error("Distributor transaction reverted.");
  return receipt.logs.flatMap((log) => {
    try {
      const decoded = decodeEventLog({
        abi: dreamDropDistributorAbi,
        data: log.data,
        topics: log.topics,
      });
      return [decoded];
    } catch {
      return [];
    }
  });
}

export async function finalizeLiveCampaign(input: {
  preparationId: string;
  mintTxHash: Hex;
  creationTxHash: Hex;
  operatorApprovalTxHash: Hex;
  upFundingTxHash: Hex;
  downFundingTxHash: Hex;
  appUrl: string;
}): Promise<{ campaign: Campaign; claimUrls: string[] }> {
  const { env, publicClient } = createClients();
  const row = (await findCampaignPreparation(
    input.preparationId,
  )) as unknown as PreparationRow | null;
  if (!row) throw new Error("Campaign preparation not found.");
  if (Date.parse(row.expires_at) <= Date.now()) throw new Error("Campaign preparation expired.");
  const payload = JSON.parse(
    decryptClaimSecret(row.payload_ciphertext, env.CLAIM_SIGNING_SECRET),
  ) as PreparationPayload;
  const campaignId = BigInt(payload.expectedCampaignId);
  const hashes = [
    input.mintTxHash,
    input.creationTxHash,
    input.operatorApprovalTxHash,
    input.upFundingTxHash,
    input.downFundingTxHash,
  ];
  const receipts = await Promise.all(
    hashes.map((hash) => publicClient.waitForTransactionReceipt({ hash })),
  );
  const [mintReceipt, creationReceipt, approvalReceipt, upReceipt, downReceipt] = [
    receipts[0]!,
    receipts[1]!,
    receipts[2]!,
    receipts[3]!,
    receipts[4]!,
  ];
  if ([mintReceipt, approvalReceipt].some((receipt) => receipt.status !== "success"))
    throw new Error("Mint or operator approval transaction reverted.");
  const creationEvents = decodedEvents(creationReceipt);
  const fundingEvents = [...decodedEvents(upReceipt), ...decodedEvents(downReceipt)];
  const created = creationEvents.find(
    (event) =>
      event.eventName === "CampaignCreated" &&
      event.args.campaignId === campaignId &&
      getAddress(event.args.creator) === payload.creator &&
      getAddress(event.args.outcomeToken) === payload.outcomeToken &&
      event.args.merkleRoot === payload.merkleRoot,
  );
  if (!created) throw new Error("CampaignCreated event does not match the prepared campaign.");
  const total = BigInt(payload.budgetRaw);
  for (const tokenId of [
    BigInt(payload.claims.find((claim) => claim.side === "UP")!.tokenId),
    BigInt(payload.claims.find((claim) => claim.side === "DOWN")!.tokenId),
  ]) {
    if (
      !fundingEvents.some(
        (event) =>
          event.eventName === "CampaignFunded" &&
          event.args.campaignId === campaignId &&
          event.args.tokenId === tokenId &&
          event.args.amount === total,
      )
    )
      throw new Error("CampaignFunded event does not match prepared inventory.");
  }
  const [upId, downId] = [
    payload.claims.find((claim) => claim.side === "UP")!.tokenId,
    payload.claims.find((claim) => claim.side === "DOWN")!.tokenId,
  ];
  const [upInventory, downInventory, operatorApproved, chainCampaign] = await Promise.all([
    publicClient.readContract({
      address: env.DREAMDROP_DISTRIBUTOR_ADDRESS as Address,
      abi: dreamDropDistributorAbi,
      functionName: "campaignInventory",
      args: [campaignId, BigInt(upId)],
    }),
    publicClient.readContract({
      address: env.DREAMDROP_DISTRIBUTOR_ADDRESS as Address,
      abi: dreamDropDistributorAbi,
      functionName: "campaignInventory",
      args: [campaignId, BigInt(downId)],
    }),
    publicClient.readContract({
      address: payload.outcomeToken,
      abi: erc6909Abi,
      functionName: "isOperator",
      args: [payload.creator, env.DREAMDROP_DISTRIBUTOR_ADDRESS as Address],
    }),
    publicClient.readContract({
      address: env.DREAMDROP_DISTRIBUTOR_ADDRESS as Address,
      abi: dreamDropDistributorAbi,
      functionName: "campaigns",
      args: [campaignId],
    }),
  ]);
  if (upInventory !== total || downInventory !== total || !operatorApproved)
    throw new Error("Distributor inventory or operator approval reconciliation failed.");
  if (
    getAddress(chainCampaign[0]) !== payload.creator ||
    getAddress(chainCampaign[1]) !== payload.outcomeToken ||
    chainCampaign[2] !== payload.merkleRoot ||
    chainCampaign[4]
  )
    throw new Error("Canonical Distributor campaign state does not match preparation.");

  let campaignRow = (await findCampaignByOnchainId(payload.expectedCampaignId)) as Record<
    string,
    unknown
  > | null;
  if (!campaignRow)
    campaignRow = (await insertCampaign({
      creator_wallet: payload.creator,
      name: payload.name,
      message: payload.message,
      market_id: payload.marketId,
      pool_address: payload.pool,
      outcome_token_address: payload.outcomeToken,
      collateral_address: payload.collateral,
      collateral_symbol: payload.collateralSymbol,
      collateral_decimals: payload.collateralDecimals,
      budget_raw: payload.budgetRaw,
      position_size_raw: payload.positionSizeRaw,
      total_drops: payload.claims.length,
      merkle_root: payload.merkleRoot,
      status: "PREPARING",
      market_expiry: new Date(payload.marketExpiry * 1000).toISOString(),
      interval_sec: payload.intervalSec,
      asset: payload.asset,
      onchain_campaign_id: payload.expectedCampaignId,
      yes_token_id: upId.toString(),
      no_token_id: downId.toString(),
      creation_tx_hash: input.creationTxHash,
      mint_tx_hash: input.mintTxHash,
      operator_approval_tx_hash: input.operatorApprovalTxHash,
      up_funding_tx_hash: input.upFundingTxHash,
      down_funding_tx_hash: input.downFundingTxHash,
      funding_tx_hash: input.downFundingTxHash,
    })) as Record<string, unknown>;
  const campaignDbId = String(campaignRow["id"]);
  const existingClaims = (await findClaimsByCampaign(campaignDbId)) as Array<{ id: string }>;
  if (existingClaims.length === 0)
    await insertClaims(
      payload.claims.map((claim) => ({
        campaign_id: campaignDbId,
        claim_index: Number(claim.claimIndex),
        side: claim.side,
        token_id: claim.tokenId.toString(),
        amount_raw: claim.amountRaw.toString(),
        secret_hash: claim.secretHash,
        leaf_hash: claim.leafHash,
        claim_code_hash: claim.claimCodeHash,
        claim_code_ciphertext: encryptClaimSecret(claim.claimCode, env.CLAIM_SIGNING_SECRET),
        secret_ciphertext: encryptClaimSecret(claim.secret, env.CLAIM_SIGNING_SECRET),
        merkle_proof: claim.merkleProof,
      })),
    );
  campaignRow = (await updateCampaign(campaignDbId, { status: "LIVE" })) as Record<string, unknown>;
  if (!row.consumed_at) await consumeCampaignPreparation(row.id);
  const campaign: Campaign = {
    id: campaignDbId,
    name: payload.name,
    marketId: payload.marketId,
    asset: payload.asset,
    collateral: {
      address: payload.collateral,
      symbol: payload.collateralSymbol,
      decimals: payload.collateralDecimals,
    },
    budget: Number(payload.budgetRaw) / 10 ** payload.collateralDecimals,
    positionSize: Number(payload.positionSizeRaw) / 10 ** payload.collateralDecimals,
    totalDrops: payload.claims.length,
    claimedDrops: 0,
    upDistributed: 0,
    downDistributed: 0,
    cashOuts: 0,
    status: "LIVE",
    message: payload.message,
    createdAt: Date.parse(String(campaignRow["created_at"])),
    onchainCampaignId: payload.expectedCampaignId,
    mintTxHash: input.mintTxHash,
    creationTxHash: input.creationTxHash,
    operatorApprovalTxHash: input.operatorApprovalTxHash,
    upFundingTxHash: input.upFundingTxHash,
    downFundingTxHash: input.downFundingTxHash,
  };
  return {
    campaign,
    claimUrls: payload.claims.map(
      (claim) => `${input.appUrl.replace(/\/$/, "")}/claim/${claim.claimCode}`,
    ),
  };
}
