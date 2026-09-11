import type {
  ActivityEvent,
  Campaign,
  CampaignClaim,
  CreateCampaignInput,
  PreparedCampaign,
} from "@/lib/types";
import { calculateCompleteSetDistribution, canCreateCampaignForMarket } from "@/lib/campaign-rules";
import { activity, campaigns, claims, delay, markets } from "./mock-db";
import { appConfig } from "@/lib/config";
import { getMarket } from "./marketService";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  createPublicClient,
  createWalletClient,
  custom,
  decodeEventLog,
  getAddress,
  http,
  parseUnits,
  type Address,
  type Hex,
} from "viem";
import { somniaTestnet } from "viem/chains";
import { dreamdexAdapter } from "./dreamdex";
import { dreamDropDistributorAbi, erc6909Abi } from "@/lib/distributor-abi";
import { signAccessProof } from "./walletService";

const accessProofSchema = z.object({
  wallet: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  resource: z.string().min(1).max(200),
  deadline: z.number().int().positive(),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/),
});

const listLiveCampaignsOnServer = createServerFn({ method: "POST" })
  .validator(accessProofSchema)
  .handler(async ({ data }) => {
    const { listCreatorCampaigns } = await import("@/server/dashboard/live-dashboard.server");
    return listCreatorCampaigns(data);
  });

const listLiveActivityOnServer = createServerFn({ method: "POST" })
  .validator(accessProofSchema)
  .handler(async ({ data }) => {
    const { listCreatorActivity } = await import("@/server/dashboard/live-dashboard.server");
    return listCreatorActivity(data);
  });

const readLiveCampaignOnServer = createServerFn({ method: "POST" })
  .validator(z.object({ proof: accessProofSchema, campaignId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { readCreatorCampaign } = await import("@/server/dashboard/live-dashboard.server");
    return readCreatorCampaign(data.proof, data.campaignId);
  });

const prepareLiveCampaignOnServer = createServerFn({ method: "POST" })
  .validator(
    z.object({
      creatorWallet: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      marketId: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
      name: z.string().min(1).max(120),
      message: z.string().max(500),
      positionSizeRaw: z.string().regex(/^[1-9][0-9]*$/),
      completeSets: z.number().int().positive().max(10_000),
    }),
  )
  .handler(async ({ data }) => {
    const { prepareLiveCampaign } = await import("@/server/campaigns/live-campaign.server");
    return prepareLiveCampaign(data);
  });

const finalizeLiveCampaignOnServer = createServerFn({ method: "POST" })
  .validator(
    z.object({
      preparationId: z.string().uuid(),
      mintTxHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
      creationTxHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
      operatorApprovalTxHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
      upFundingTxHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
      downFundingTxHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
      appUrl: z.string().url(),
    }),
  )
  .handler(async ({ data }) => {
    const { finalizeLiveCampaign } = await import("@/server/campaigns/live-campaign.server");
    return finalizeLiveCampaign(data as Parameters<typeof finalizeLiveCampaign>[0]);
  });

const erc20BalanceAbi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

async function executeLiveCampaign(input: CreateCampaignInput): Promise<Campaign> {
  if (typeof window === "undefined" || !window.ethereum)
    throw new Error("Live campaign creation requires an injected creator wallet.");
  if (!/^0x[0-9a-fA-F]{40}$/.test(appConfig.distributorAddress))
    throw new Error("VITE_DREAMDROP_DISTRIBUTOR_ADDRESS is not configured.");
  const [accounts, chainId] = await Promise.all([
    window.ethereum.request({ method: "eth_accounts" }) as Promise<string[]>,
    window.ethereum.request({ method: "eth_chainId" }) as Promise<string>,
  ]);
  if (!accounts[0]) throw new Error("Connect Creator Wallet A before creating a campaign.");
  if (Number.parseInt(chainId, 16) !== appConfig.chainId)
    throw new Error("Switch Creator Wallet A to Somnia Shannon before continuing.");
  const creator = getAddress(accounts[0]);
  const distributor = getAddress(appConfig.distributorAddress);
  const market = await getMarket(input.marketId);
  if (
    !canCreateCampaignForMarket(market) ||
    !market.outcomeTokenAddress ||
    !market.yesTokenId ||
    !market.noTokenId ||
    !market.poolAddress
  )
    throw new Error("The selected DreamDEX market is not eligible for a live campaign.");
  const distribution = calculateCompleteSetDistribution(input.budget, input.positionSize);
  if (distribution.completeSets <= 0)
    throw new Error("Campaign budget must fund at least one drop per side.");
  const positionSizeRaw = parseUnits(String(input.positionSize), market.collateral.decimals);
  const totalAmountRaw = positionSizeRaw * BigInt(distribution.completeSets);
  const preparationInput = {
    creatorWallet: creator,
    marketId: input.marketId,
    name: input.name,
    message: input.message,
    positionSizeRaw: positionSizeRaw.toString(),
    completeSets: distribution.completeSets,
  };
  let prepared = await prepareLiveCampaignOnServer({
    data: {
      ...preparationInput,
    },
  });
  if (
    prepared.distributorAddress.toLowerCase() !== distributor.toLowerCase() ||
    prepared.outcomeToken.toLowerCase() !== market.outcomeTokenAddress.toLowerCase() ||
    prepared.pool.toLowerCase() !== market.poolAddress.toLowerCase() ||
    prepared.totalUpAmountRaw !== totalAmountRaw.toString()
  )
    throw new Error("Canonical market data changed while preparing the campaign.");

  const transport = custom(window.ethereum);
  const walletClient = createWalletClient({ account: creator, chain: somniaTestnet, transport });
  const publicClient = createPublicClient({
    chain: somniaTestnet,
    transport: http(appConfig.rpcUrl),
  });
  const collateralBalance = await publicClient.readContract({
    address: prepared.collateral,
    abi: erc20BalanceAbi,
    functionName: "balanceOf",
    args: [creator],
  });
  if (collateralBalance < totalAmountRaw)
    throw new Error(`Creator Wallet A needs at least ${totalAmountRaw} raw collateral units.`);
  const mint = await dreamdexAdapter.mintCompleteSet({
    marketId: prepared.marketId,
    amountRaw: totalAmountRaw,
  });

  const simulateCreate = () =>
    publicClient.simulateContract({
      account: creator,
      address: distributor,
      abi: dreamDropDistributorAbi,
      functionName: "createCampaign",
      args: [
        prepared.outcomeToken,
        prepared.merkleRoot,
        BigInt(prepared.claimDeadline),
        BigInt(prepared.expectedCampaignId),
      ],
    });
  let createSimulation;
  try {
    createSimulation = await simulateCreate();
  } catch (error) {
    const currentId = await publicClient.readContract({
      address: distributor,
      abi: dreamDropDistributorAbi,
      functionName: "nextCampaignId",
    });
    if (currentId === BigInt(prepared.expectedCampaignId)) throw error;
    prepared = await prepareLiveCampaignOnServer({ data: preparationInput });
    createSimulation = await simulateCreate();
  }
  const creationTxHash = await walletClient.writeContract(createSimulation.request);
  const creationReceipt = await publicClient.waitForTransactionReceipt({ hash: creationTxHash });
  if (creationReceipt.status !== "success")
    throw new Error("Distributor campaign creation reverted.");
  const created = creationReceipt.logs
    .flatMap((log) => {
      try {
        const event = decodeEventLog({
          abi: dreamDropDistributorAbi,
          data: log.data,
          topics: log.topics,
        });
        return event.eventName === "CampaignCreated" ? [event] : [];
      } catch {
        return [];
      }
    })
    .find(
      (event) =>
        getAddress(event.args.creator) === creator && event.args.merkleRoot === prepared.merkleRoot,
    );
  if (!created) throw new Error("CampaignCreated event was not found in the confirmed receipt.");
  if (created.args.campaignId.toString() !== prepared.expectedCampaignId)
    throw new Error(
      "Distributor campaign ID changed during preparation; inventory was not funded.",
    );
  const campaignId = created.args.campaignId;

  const approvalSimulation = await publicClient.simulateContract({
    account: creator,
    address: prepared.outcomeToken,
    abi: erc6909Abi,
    functionName: "setOperator",
    args: [distributor, true],
  });
  const operatorApprovalTxHash = await walletClient.writeContract(approvalSimulation.request);
  const approvalReceipt = await publicClient.waitForTransactionReceipt({
    hash: operatorApprovalTxHash,
  });
  if (approvalReceipt.status !== "success")
    throw new Error("Distributor operator approval reverted.");
  const approved = await publicClient.readContract({
    address: prepared.outcomeToken,
    abi: erc6909Abi,
    functionName: "isOperator",
    args: [creator, distributor],
  });
  if (!approved) throw new Error("Distributor operator approval was not recorded on-chain.");

  const fund = async (tokenId: string, amountRaw: string) => {
    const simulation = await publicClient.simulateContract({
      account: creator,
      address: distributor,
      abi: dreamDropDistributorAbi,
      functionName: "fundCampaign",
      args: [campaignId, BigInt(tokenId), BigInt(amountRaw)],
    });
    const hash = await walletClient.writeContract(simulation.request);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") throw new Error(`Distributor funding reverted: ${hash}`);
    const funded = receipt.logs.some((log) => {
      try {
        const event = decodeEventLog({
          abi: dreamDropDistributorAbi,
          data: log.data,
          topics: log.topics,
        });
        return (
          event.eventName === "CampaignFunded" &&
          event.args.campaignId === campaignId &&
          event.args.tokenId === BigInt(tokenId) &&
          event.args.amount === BigInt(amountRaw)
        );
      } catch {
        return false;
      }
    });
    if (!funded) throw new Error("Confirmed funding receipt is missing CampaignFunded.");
    const inventory = await publicClient.readContract({
      address: distributor,
      abi: dreamDropDistributorAbi,
      functionName: "campaignInventory",
      args: [campaignId, BigInt(tokenId)],
    });
    if (inventory !== BigInt(amountRaw))
      throw new Error("Campaign inventory reconciliation failed.");
    return hash;
  };
  const upFundingTxHash = await fund(prepared.yesTokenId, prepared.totalUpAmountRaw);
  const downFundingTxHash = await fund(prepared.noTokenId, prepared.totalDownAmountRaw);
  const finalized = await finalizeLiveCampaignOnServer({
    data: {
      preparationId: prepared.preparationId,
      mintTxHash: mint.transactionHash,
      creationTxHash,
      operatorApprovalTxHash,
      upFundingTxHash,
      downFundingTxHash,
      appUrl: appConfig.appUrl,
    },
  });
  return { ...finalized.campaign, claimUrls: finalized.claimUrls };
}
export async function getCampaigns(walletAddress?: string) {
  if (appConfig.dataMode === "live") {
    if (!walletAddress) throw new Error("Connect the creator wallet to view campaigns.");
    const proof = await signAccessProof(walletAddress, "creator:campaigns");
    return listLiveCampaignsOnServer({ data: proof });
  }
  return delay([...campaigns]);
}
export async function getCampaign(id: string, walletAddress?: string) {
  if (appConfig.dataMode === "live") {
    if (!walletAddress) throw new Error("Connect the creator wallet to view this campaign.");
    const proof = await signAccessProof(walletAddress, `creator:campaign:${id}`);
    const result = await readLiveCampaignOnServer({ data: { proof, campaignId: id } });
    return result.campaign;
  }
  const v = campaigns.find((c) => c.id === id);
  if (!v) throw new Error("Campaign not found");
  return delay(v, 300);
}
export async function prepareCampaign(input: CreateCampaignInput): Promise<PreparedCampaign> {
  const market = await getMarket(input.marketId);
  if (!canCreateCampaignForMarket(market))
    throw new Error("This market is ending too soon to create a reliable DreamDrop campaign.");
  return delay({
    ...input,
    ...calculateCompleteSetDistribution(input.budget, input.positionSize),
    collateral: market.collateral,
  });
}
export async function createCampaign(input: CreateCampaignInput): Promise<Campaign> {
  if (appConfig.dataMode === "live") return executeLiveCampaign(input);
  const p = await prepareCampaign(input);
  const m = markets.find((v) => v.id === input.marketId)!;
  const c: Campaign = {
    id: `cmp-${String(campaigns.length + 1).padStart(3, "0")}`,
    name: input.name,
    marketId: input.marketId,
    asset: m.asset,
    collateral: m.collateral,
    budget: input.budget,
    positionSize: input.positionSize,
    totalDrops: p.totalDrops,
    claimedDrops: 0,
    upDistributed: 0,
    downDistributed: 0,
    cashOuts: 0,
    status: "LIVE",
    message: input.message,
    createdAt: Date.now(),
  };
  campaigns.unshift(c);
  return delay(c, 600);
}
export async function getCampaignClaims(
  campaignId: string,
  walletAddress?: string,
): Promise<CampaignClaim[]> {
  if (appConfig.dataMode === "live") {
    if (!walletAddress) throw new Error("Connect the creator wallet to view claim links.");
    const proof = await signAccessProof(walletAddress, `creator:campaign:${campaignId}`);
    return (await readLiveCampaignOnServer({ data: { proof, campaignId } })).claims;
  }
  return delay(
    claims
      .filter((c) => c.campaignId === campaignId)
      .map((c, i) => ({
        id: `${campaignId}-${i + 1}`,
        campaignId,
        code: c.code,
        claimed: c.status === "ALREADY_CLAIMED",
      })),
  );
}
export async function getCampaignActivity(
  campaignId?: string,
  walletAddress?: string,
): Promise<ActivityEvent[]> {
  if (appConfig.dataMode === "live") {
    if (!walletAddress) return [];
    if (!campaignId) {
      const proof = await signAccessProof(walletAddress, "creator:campaigns");
      return listLiveActivityOnServer({ data: proof });
    }
    const proof = await signAccessProof(walletAddress, `creator:campaign:${campaignId}`);
    return (await readLiveCampaignOnServer({ data: { proof, campaignId } })).activity;
  }
  return delay([...activity]);
}
export const getActivity = getCampaignActivity;
