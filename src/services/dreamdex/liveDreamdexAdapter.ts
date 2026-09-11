import {
  SomniaMarkets,
  SOMNIA_TESTNET_ADDRESSES,
  ORDER_TYPE,
  quoteBinarySellOverBook,
  type BinaryMarket,
} from "@somnia-chain/markets-sdk";
import { somniaTestnet } from "viem/chains";
import { createWalletClient, custom, getAddress } from "viem";
import { appConfig } from "@/lib/config";
import type { Market, MarketOrderBook } from "@/lib/types";
import { normalizeDreamdexMarket } from "./normalizeMarket";
import type { DreamdexAdapter } from "./types";

function asMarketId(value: string): `0x${string}` {
  if (!/^0x[0-9a-fA-F]{64}$/.test(value)) throw new Error(`Invalid DreamDEX market id: ${value}`);
  return value as `0x${string}`;
}

export function createLiveDreamdexAdapter(): DreamdexAdapter {
  const testUsdc = SOMNIA_TESTNET_ADDRESSES.testUsdc;
  if (!testUsdc) throw new Error("DreamDEX Shannon tUSDC address is not configured.");
  const exchange = new SomniaMarkets({
    chain: somniaTestnet,
    addresses: SOMNIA_TESTNET_ADDRESSES,
    wsRpcUrl: appConfig.somniaWsRpcUrl,
    indexerUrl: appConfig.dreamdexIndexerUrl,
  });

  async function resolve(indexed: BinaryMarket): Promise<Market> {
    const onchain = await exchange.client.getMarketOnchain(asMarketId(indexed.marketId));
    return normalizeDreamdexMarket(indexed, onchain);
  }

  return {
    dataSource: "live",
    async discoverMarkets() {
      const indexed = await exchange.client.listBinaryMarkets({
        status: "Trading",
        orderBy: "closingSoon",
        limit: 30,
      });
      const supported = indexed.filter(
        (market) => market.collateral.toLowerCase() === testUsdc.toLowerCase(),
      );
      const settled = await Promise.allSettled(supported.map(resolve));
      return settled.flatMap((result) =>
        result.status === "fulfilled" && result.value.canCreateCampaign ? [result.value] : [],
      );
    },

    async getMarketOnchain(marketId) {
      const indexed = await exchange.client.getBinaryMarket(asMarketId(marketId));
      if (!indexed) throw new Error(`DreamDEX market not found: ${marketId}`);
      return resolve(indexed);
    },

    getOutcomeBalance({ outcomeToken, account, tokenId }) {
      return exchange.client.getOutcomeBalance({ outcomeToken, account, id: tokenId });
    },

    async mintCompleteSet({ marketId, amountRaw }) {
      if (typeof window === "undefined" || !window.ethereum)
        throw new Error("Live complete-set minting requires an injected creator wallet.");
      if (amountRaw <= 0n) throw new Error("Complete-set amount must be positive.");
      const accounts = (await window.ethereum.request({ method: "eth_accounts" })) as string[];
      if (!accounts[0]) throw new Error("Connect the creator wallet before minting.");
      const account = getAddress(accounts[0]);
      const walletClient = createWalletClient({
        account,
        chain: somniaTestnet,
        transport: custom(window.ethereum),
      });
      exchange.setSigner({ walletClient });
      const onchain = await exchange.client.getMarketOnchain(marketId);
      if (
        onchain.finalized ||
        onchain.status !== 1 ||
        onchain.expiry <= BigInt(Math.floor(Date.now() / 1000))
      )
        throw new Error("DreamDEX market is no longer trading.");
      const balance = (tokenId: bigint) =>
        exchange.client.getOutcomeBalance({
          outcomeToken: onchain.outcomeToken,
          account,
          id: tokenId,
        });
      const [yesBalanceBefore, noBalanceBefore] = await Promise.all([
        balance(onchain.yesId),
        balance(onchain.noId),
      ]);
      const transaction = await exchange.trader.mintSet({
        pool: onchain.pool,
        collateral: onchain.collateral,
        amount: amountRaw,
      });
      if (transaction.receipt.status !== "success")
        throw new Error(`DreamDEX mint transaction reverted: ${transaction.hash}`);
      const [yesBalanceAfter, noBalanceAfter] = await Promise.all([
        balance(onchain.yesId),
        balance(onchain.noId),
      ]);
      if (
        yesBalanceAfter - yesBalanceBefore !== amountRaw ||
        noBalanceAfter - noBalanceBefore !== amountRaw
      )
        throw new Error("DreamDEX mint receipt did not produce the exact UP/DOWN balance deltas.");
      return {
        transactionHash: transaction.hash,
        yesBalanceBefore,
        yesBalanceAfter,
        noBalanceBefore,
        noBalanceAfter,
      };
    },

    async getOrderBook(marketId): Promise<MarketOrderBook> {
      return { marketId, bids: [], asks: [], updatedAt: Date.now() };
    },

    async getSettlementStatus(marketId) {
      return (await this.getMarketOnchain(marketId)).status;
    },

    async quoteCashout({ marketId, side, quantityRaw }) {
      const onchain = await exchange.client.getMarketOnchain(marketId);
      if (onchain.finalized || onchain.status !== 1 || onchain.expiry <= BigInt(Date.now() / 1000))
        return null;
      const [book, grid] = await Promise.all([
        exchange.client.getBinaryOrderBook(onchain.pool, {
          depth: 100,
          decimals: onchain.decimals,
        }),
        exchange.client.getBinaryBookParams(onchain.pool),
      ]);
      const quote = quoteBinarySellOverBook(
        book,
        side === "UP" ? "SELL_YES" : "SELL_NO",
        quantityRaw,
        10n ** BigInt(onchain.decimals),
        { ...grid, slippageBps: 100n, slippageMinTicks: 2n },
      );
      return quote
        ? {
            limitPriceRaw: quote.limitPrice,
            quantityRaw: quote.quantity,
            fillableQuantityRaw: quote.fillableQuantity,
            estimatedProceedsRaw: quote.estProceeds,
            decimals: onchain.decimals,
          }
        : null;
    },

    async executeCashout({ marketId, side, quantityRaw }) {
      if (typeof window === "undefined" || !window.ethereum)
        throw new Error("Cash-out requires the connected recipient wallet.");
      const accounts = (await window.ethereum.request({ method: "eth_accounts" })) as string[];
      if (!accounts[0]) throw new Error("Connect the position owner wallet.");
      const account = getAddress(accounts[0]);
      const onchain = await exchange.client.getMarketOnchain(marketId);
      if (onchain.finalized || onchain.status !== 1 || onchain.expiry <= BigInt(Date.now() / 1000))
        throw new Error("This market is no longer trading.");
      const tokenId = side === "UP" ? onchain.yesId : onchain.noId;
      const before = await exchange.client.getOutcomeBalance({
        outcomeToken: onchain.outcomeToken,
        account,
        id: tokenId,
      });
      if (before < quantityRaw) throw new Error("The wallet no longer holds the full position.");
      const quote = await this.quoteCashout({ marketId, side, quantityRaw });
      if (!quote || quote.quantityRaw !== quantityRaw || quote.fillableQuantityRaw !== quantityRaw)
        throw new Error("No full cash-out liquidity right now. Hold until settlement.");
      exchange.setSigner({
        walletClient: createWalletClient({
          account,
          chain: somniaTestnet,
          transport: custom(window.ethereum),
        }),
      });
      const result = await exchange.trader.placeOrder({
        pool: onchain.pool,
        side: side === "UP" ? "SELL_YES" : "SELL_NO",
        price:
          side === "UP"
            ? quote.limitPriceRaw
            : 10n ** BigInt(onchain.decimals) - quote.limitPriceRaw,
        quantity: quantityRaw,
        outcomeToken: onchain.outcomeToken,
        yesId: onchain.yesId,
        noId: onchain.noId,
        collateral: onchain.collateral,
        orderType: ORDER_TYPE.FILL_OR_KILL,
      });
      if (result.receipt.status !== "success") throw new Error("DreamDEX cash-out reverted.");
      const filled = result.fills.reduce((sum, fill) => sum + fill.quantityFilled, 0n);
      if (filled !== quantityRaw)
        throw new Error("DreamDEX did not fill the full cash-out quantity.");
      const after = await exchange.client.getOutcomeBalance({
        outcomeToken: onchain.outcomeToken,
        account,
        id: tokenId,
      });
      if (before - after !== quantityRaw)
        throw new Error("Outcome balance did not decrease by the sold quantity.");
      const one = 10n ** BigInt(onchain.decimals);
      const proceedsRaw = result.fills.reduce((sum, fill) => {
        const ownPrice = side === "UP" ? fill.fillPrice : one - fill.fillPrice;
        return sum + (fill.quantityFilled * ownPrice) / one;
      }, 0n);
      return { transactionHash: result.hash, proceedsRaw };
    },

    async redeemPosition({ marketId, side, amountRaw }) {
      if (typeof window === "undefined" || !window.ethereum)
        throw new Error("Redemption requires the connected recipient wallet.");
      const accounts = (await window.ethereum.request({ method: "eth_accounts" })) as string[];
      if (!accounts[0]) throw new Error("Connect the position owner wallet.");
      const account = getAddress(accounts[0]);
      const onchain = await exchange.client.getMarketOnchain(marketId);
      if (!onchain.finalized || (!onchain.isResolved && !onchain.isVoided))
        throw new Error("The market is not finalized for redemption.");
      if (!onchain.isVoided && onchain.winningOutcome !== (side === "UP" ? 0 : 1))
        throw new Error("This position did not win and is not redeemable.");
      const collateralBefore = await exchange.client.getErc20Balance(onchain.collateral, account);
      exchange.setSigner({
        walletClient: createWalletClient({
          account,
          chain: somniaTestnet,
          transport: custom(window.ethereum),
        }),
      });
      const result = await exchange.trader.redeem({
        marketId,
        outcomeIdx: side === "UP" ? 0 : 1,
        amount: amountRaw,
        outcomeToken: onchain.outcomeToken,
      });
      if (result.receipt.status !== "success") throw new Error("DreamDEX redemption reverted.");
      const collateralAfter = await exchange.client.getErc20Balance(onchain.collateral, account);
      if (collateralAfter <= collateralBefore)
        throw new Error("Redemption did not increase the recipient collateral balance.");
      return { transactionHash: result.hash, proceedsRaw: collateralAfter - collateralBefore };
    },
  };
}
