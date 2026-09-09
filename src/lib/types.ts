export type Asset = "BTC" | "ETH" | (string & {});
export type PredictionSide = "UP" | "DOWN";
export type Side = PredictionSide;
export type MarketStatus = "TRADING" | "LOCKING" | "LOCKED" | "RESOLVING" | "FINALIZED" | "VOIDED" | "EXPIRED";
export type Liquidity = "HEALTHY" | "THIN" | "NONE";
export type HexAddress = `0x${string}`;
export type TransactionHash = `0x${string}`;
export interface CollateralToken { address: string; symbol: string; decimals: number; }
export interface Market { id: string; marketId?: string; asset: Asset; question: string; strike?: string; intervalSec: number; upProbability: number; downProbability: number; bestUpCashout: number | null; bestDownCashout: number | null; status: MarketStatus; liquidity: Liquidity; expiresAt: number; collateral: CollateralToken; canCreateCampaign: boolean; venueId?: string; poolAddress?: string; outcomeTokenAddress?: string; yesTokenId?: string; noTokenId?: string; settledSide?: Side; }
export type CampaignStatus = "DRAFT" | "PREPARING" | "AWAITING_APPROVAL" | "MINTING" | "FUNDING" | "LIVE" | "ENDING" | "SETTLED" | "CLOSED" | "FAILED";
export interface Campaign { id: string; name: string; marketId: string; asset: Asset; collateral: CollateralToken; budget: number; positionSize: number; totalDrops: number; claimedDrops: number; upDistributed: number; downDistributed: number; cashOuts: number; status: CampaignStatus; message: string; createdAt: number; }
export interface CreateCampaignInput { name: string; marketId: string; budget: number; positionSize: number; message: string; }
export interface PreparedCampaign extends CreateCampaignInput { completeSets: number; upDrops: number; downDrops: number; totalDrops: number; collateral: CollateralToken; }
export type ClaimPreviewStatus = "AVAILABLE" | "ALREADY_CLAIMED" | "EXPIRED" | "INVALID";
export type ClaimStatus = ClaimPreviewStatus | "CONNECTING" | "SIGNING" | "SUBMITTING" | "CONFIRMING" | "CLAIMED" | "FAILED";
export interface ClaimPreview { code: string; campaignId: string; campaignName: string; asset: Asset; potentialPayout: number; expiresAt: number; status: ClaimPreviewStatus; message: string; }
export interface ClaimChallenge { id: string; code: string; walletAddress: string; message: string; expiresAt: number; }
export interface ClaimedDrop { claimId: string; positionId: string; side: Side; quantity: number; transactionHash: string; status: "CONFIRMED"; position: Position; }
export type PositionStatus = "ACTIVE" | "SOLD" | "RESOLVING" | "WON" | "LOST" | "VOIDED" | "REDEEMABLE" | "REDEEMED";
export interface Position { id: string; campaignId: string; claimId: string; marketId: string; asset: Asset; side: Side; tokenId: string; quantity: number; marketProbability: number; cashoutPrice: number; potentialPayout: number; potentialGrossPayout: number; estimatedNetPayout?: number; settlementFee?: number; status: PositionStatus; expiresAt: number; claimedFrom: string; claimedAt: number; claimTx: string; claimTxHash?: string; cashoutTxHash?: string; redemptionTxHash?: string; network: string; soldFor?: number; probabilityHistory: number[]; }
export interface CashoutQuote { id: string; positionId: string; marketProbability: number; bestExecutablePrice: number | null; quantityRequested: number; executableQuantity: number; estimatedProceeds: number | null; minimumProceeds: number | null; expiresAt: number; canCashOut: boolean; }
export interface RedemptionQuote { positionId: string; grossPayout: number; estimatedNetPayout?: number; canRedeem: boolean; }
export type TransactionFlowStatus = "IDLE" | "PREPARING" | "AWAITING_SIGNATURE" | "SUBMITTING" | "CONFIRMING" | "CONFIRMED" | "FAILED";
export interface PreparedTransaction { id: string; status: TransactionFlowStatus; transactionHash?: string; }
export interface RawOrderBookLevel { price: bigint; quantity: bigint; }
export interface MarketOrderBook { marketId: string; bids: Array<[number, number]>; asks: Array<[number, number]>; rawBids?: RawOrderBookLevel[]; rawAsks?: RawOrderBookLevel[]; updatedAt: number; }
export interface CampaignClaim { id: string; campaignId: string; code: string; claimed: boolean; }
export interface ActivityEvent { id: string; kind: "CLAIM" | "CASHOUT" | "SETTLED"; text: string; at: number; }
