import {
  SomniaMarkets,
  SOMNIA_TESTNET_ADDRESSES,
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
  };
}
