import "dotenv/config";
import {
  SomniaMarkets,
  SOMNIA_TESTNET_ADDRESSES,
} from "@somnia-chain/markets-sdk";
import { somniaTestnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const privateKey = process.env["DREAMDEX_SMOKE_PRIVATE_KEY"] as `0x${string}` | undefined;
if (!privateKey) {
  throw new Error("DREAMDEX_SMOKE_PRIVATE_KEY is required; use a dedicated funded Shannon test wallet.");
}

const exchange = new SomniaMarkets({
  chain: somniaTestnet,
  addresses: SOMNIA_TESTNET_ADDRESSES,
  privateKey,
  wsRpcUrl: process.env["SOMNIA_WS_RPC_URL"] ?? "wss://api.infra.testnet.somnia.network/ws",
  indexerUrl: process.env["DREAMDEX_INDEXER_URL"] ?? "https://dev.smk.somnia.host/v1/graphql",
});

const markets = await exchange.client.listBinaryMarkets({});
const candidate = markets.find((market) =>
  market.collateral.toLowerCase() === SOMNIA_TESTNET_ADDRESSES.testUsdc.toLowerCase(),
);
if (!candidate) throw new Error("No Shannon tUSDC Event Contract is currently discoverable.");

const market = await exchange.client.getMarketOnchain(candidate.marketId);
console.log({
  marketId: candidate.marketId,
  pool: candidate.pool,
  status: market.status,
  collateral: candidate.collateral,
  outcomeToken: market.outcomeToken,
  outcomeIds: [String(market.yesId), String(market.noId)],
});

if (process.env["DREAMDEX_SMOKE_WRITE"] !== "true") {
  console.log("Read smoke passed. Set DREAMDEX_SMOKE_WRITE=true to mint one 1e6-unit complete set.");
  process.exit(0);
}

// Writes always re-read canonical state immediately before submission.
const fresh = await exchange.client.getMarketOnchain(candidate.marketId);
if (fresh.finalized || fresh.status !== 1) throw new Error(`Market is no longer tradable (status=${fresh.status}).`);

const amount = 1_000_000n;
const tx = await exchange.trader.mintSet({ pool: candidate.pool, amount });
const account = privateKeyToAccount(privateKey).address;
const balances = await Promise.all(
  [BigInt(fresh.yesId), BigInt(fresh.noId)].map((id) => exchange.client.getOutcomeBalance({ outcomeToken: fresh.outcomeToken, account, id })),
);
if (balances.some((balance) => balance < amount)) {
  throw new Error(`Mint transaction ${tx} confirmed but outcome balances did not reconcile.`);
}
console.log({ mintTxHash: tx.hash, balances: balances.map(String) });
process.exit(0);
