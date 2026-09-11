import type { CashoutQuote, Position, PreparedTransaction, RedemptionQuote } from "@/lib/types";
import { delay, positions } from "./mock-db";
import { appConfig } from "@/lib/config";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { signAccessProof } from "./walletService";
import { dreamdexAdapter } from "./dreamdex";
import { getMarket } from "./marketService";

const accessProofSchema = z.object({
  wallet: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  resource: z.string(),
  deadline: z.number().int().positive(),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/),
});
const listLivePositionsOnServer = createServerFn({ method: "POST" })
  .validator(accessProofSchema)
  .handler(async ({ data }) => {
    const { listOwnerPositions } = await import("@/server/dashboard/live-dashboard.server");
    return listOwnerPositions(data);
  });
const readLivePositionOnServer = createServerFn({ method: "POST" })
  .validator(z.object({ proof: accessProofSchema, positionId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { readOwnerPosition } = await import("@/server/dashboard/live-dashboard.server");
    return readOwnerPosition(data.proof, data.positionId);
  });
const recordLivePositionActionOnServer = createServerFn({ method: "POST" })
  .validator(
    z.object({
      proof: accessProofSchema,
      positionId: z.string().uuid(),
      action: z.enum(["cashout", "redemption"]),
      txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
      proceedsRaw: z.string().regex(/^[0-9]+$/),
    }),
  )
  .handler(async ({ data }) => {
    const { recordOwnerPositionAction } = await import("@/server/dashboard/live-dashboard.server");
    return recordOwnerPositionAction(
      data.proof,
      data.positionId,
      data.action,
      data.txHash,
      data.proceedsRaw,
    );
  });

async function connectedAddress() {
  if (typeof window === "undefined" || !window.ethereum) throw new Error("Connect your wallet.");
  const accounts = (await window.ethereum.request({ method: "eth_accounts" })) as string[];
  if (!accounts[0]) throw new Error("Connect your wallet.");
  return accounts[0];
}

export async function getPositions(walletAddress?: string) {
  if (appConfig.dataMode === "live") {
    if (!walletAddress) return [];
    const proof = await signAccessProof(walletAddress, "owner:positions");
    return listLivePositionsOnServer({ data: proof });
  }
  return delay([...positions]);
}
export async function getPosition(id: string, walletAddress?: string) {
  if (appConfig.dataMode === "live") {
    if (!walletAddress) throw new Error("Connect the owner wallet to view this position.");
    const proof = await signAccessProof(walletAddress, `owner:position:${id}`);
    return readLivePositionOnServer({ data: { proof, positionId: id } });
  }
  const p = positions.find((v) => v.id === id);
  if (!p) throw new Error("Position not found");
  return delay(p);
}
export async function getCashoutQuote(id: string): Promise<CashoutQuote> {
  if (appConfig.dataMode === "live") {
    const wallet = await connectedAddress();
    const p = await getPosition(id, wallet);
    if (p.status !== "ACTIVE" || !p.amountRaw || p.collateralDecimals === undefined)
      throw new Error("Position cannot be cashed out.");
    const market = await getMarket(p.marketId);
    const quote = await dreamdexAdapter.quoteCashout({
      marketId: p.marketId as `0x${string}`,
      side: p.side,
      quantityRaw: BigInt(p.amountRaw),
    });
    const scale = 10 ** p.collateralDecimals;
    const requested = Number(p.amountRaw) / scale;
    return {
      id: `live-${Date.now()}`,
      positionId: id,
      marketProbability: p.side === "UP" ? market.upProbability : market.downProbability,
      bestExecutablePrice: quote
        ? Number(quote.estimatedProceedsRaw) / Number(quote.fillableQuantityRaw)
        : null,
      quantityRequested: requested,
      executableQuantity: quote ? Number(quote.fillableQuantityRaw) / scale : 0,
      estimatedProceeds: quote ? Number(quote.estimatedProceedsRaw) / scale : null,
      minimumProceeds: quote
        ? Number((quote.quantityRaw * quote.limitPriceRaw) / BigInt(scale)) / scale
        : null,
      expiresAt: Date.now() + 8_000,
      canCashOut: Boolean(quote && quote.fillableQuantityRaw === BigInt(p.amountRaw)),
    };
  }
  const p = positions.find((v) => v.id === id);
  if (!p) throw new Error("Position not found");
  const ok = p.id !== "pos-002" && p.status === "ACTIVE";
  const price = ok
    ? Math.max(0.01, Number((p.cashoutPrice + (Math.random() - 0.5) * 0.02).toFixed(2)))
    : null;
  return delay({
    id: `quote-${Date.now()}`,
    positionId: id,
    marketProbability: p.marketProbability,
    bestExecutablePrice: price,
    quantityRequested: p.quantity,
    executableQuantity: ok ? p.quantity : 0,
    estimatedProceeds: price === null ? null : price * p.quantity,
    minimumProceeds: price === null ? null : Number((price * p.quantity - 0.01).toFixed(2)),
    expiresAt: Date.now() + 8000,
    canCashOut: ok,
  });
}
export async function prepareCashout({
  positionId,
  quoteId,
}: {
  positionId: string;
  quoteId: string;
}): Promise<PreparedTransaction> {
  if (!quoteId) throw new Error("Quote required");
  const p = await getPosition(positionId);
  if (p.status !== "ACTIVE") throw new Error("Position cannot be cashed out");
  return { id: `cashout-${Date.now()}`, status: "AWAITING_SIGNATURE" };
}
export async function cashOutPosition(id: string, price: number) {
  if (appConfig.dataMode === "live") {
    void price;
    const wallet = await connectedAddress();
    const p = await getPosition(id, wallet);
    if (p.status !== "ACTIVE" || !p.amountRaw) throw new Error("Position cannot be cashed out.");
    const result = await dreamdexAdapter.executeCashout({
      marketId: p.marketId as `0x${string}`,
      side: p.side,
      quantityRaw: BigInt(p.amountRaw),
    });
    const proof = await signAccessProof(wallet, `owner:position:${id}`);
    return recordLivePositionActionOnServer({
      data: {
        proof,
        positionId: id,
        action: "cashout",
        txHash: result.transactionHash,
        proceedsRaw: result.proceedsRaw.toString(),
      },
    });
  }
  const p = await getPosition(id);
  if (p.status !== "ACTIVE") throw new Error("Position cannot be cashed out");
  p.status = "SOLD";
  p.soldFor = price;
  p.cashoutTxHash = `0xcashout${Date.now()}`;
  return delay(p, 900);
}
export async function getRedemptionQuote(id: string): Promise<RedemptionQuote> {
  const p = await getPosition(id);
  return {
    positionId: id,
    grossPayout: p.potentialGrossPayout,
    canRedeem: p.status === "WON" || p.status === "REDEEMABLE" || p.status === "VOIDED",
  };
}
export async function prepareRedemption(id: string): Promise<PreparedTransaction> {
  const q = await getRedemptionQuote(id);
  if (!q.canRedeem) throw new Error("This position is not redeemable");
  return { id: `redeem-${Date.now()}`, status: "AWAITING_SIGNATURE" };
}
export async function redeemPosition(id: string) {
  if (appConfig.dataMode === "live") {
    const wallet = await connectedAddress();
    const p = await getPosition(id, wallet);
    if (!p.amountRaw) throw new Error("Position amount is unavailable.");
    const result = await dreamdexAdapter.redeemPosition({
      marketId: p.marketId as `0x${string}`,
      side: p.side,
      amountRaw: BigInt(p.amountRaw),
    });
    const proof = await signAccessProof(wallet, `owner:position:${id}`);
    return recordLivePositionActionOnServer({
      data: {
        proof,
        positionId: id,
        action: "redemption",
        txHash: result.transactionHash,
        proceedsRaw: result.proceedsRaw.toString(),
      },
    });
  }
  await prepareRedemption(id);
  const p = await getPosition(id);
  p.status = "REDEEMED";
  p.redemptionTxHash = `0xredeem${Date.now()}`;
  return delay(p, 900);
}
