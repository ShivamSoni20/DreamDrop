import "dotenv/config";
import { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES } from "@somnia-chain/markets-sdk";
import { somniaTestnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const privateKey = process.env["DREAMDEX_SMOKE_PRIVATE_KEY"] as `0x${string}` | undefined;
const writeEnabled = process.env["DREAMDEX_SMOKE_WRITE"] === "true";

if (writeEnabled && !privateKey) {
  throw new Error(
    "DREAMDEX_SMOKE_PRIVATE_KEY is required for write mode; use a dedicated funded Shannon wallet.",
  );
}

const exchange = new SomniaMarkets({
  chain: somniaTestnet,
  addresses: SOMNIA_TESTNET_ADDRESSES,
  wsRpcUrl: process.env["SOMNIA_WS_RPC_URL"] ?? "wss://api.infra.testnet.somnia.network/ws",
  indexerUrl: process.env["DREAMDEX_INDEXER_URL"] ?? "https://dev.smk.somnia.host/v1/graphql",
  ...(privateKey ? { privateKey } : {}),
});

try {
  const indexedMarkets = await exchange.client.listBinaryMarkets({
    status: "Trading",
    orderBy: "closingSoon",
    limit: 50,
  });
  const candidates = indexedMarkets.filter(
    (market) =>
      market.collateral.toLowerCase() === SOMNIA_TESTNET_ADDRESSES.testUsdc.toLowerCase() &&
      Number(market.expiry) > Math.floor(Date.now() / 1000),
  );

  let selected:
    | {
        candidate: (typeof candidates)[number];
        onchain: Awaited<ReturnType<typeof exchange.client.getMarketOnchain>>;
      }
    | undefined;
  for (const candidate of candidates) {
    const onchain = await exchange.client.getMarketOnchain(candidate.marketId);
    if (
      !onchain.finalized &&
      onchain.status === 1 &&
      onchain.expiry > BigInt(Math.floor(Date.now() / 1000))
    ) {
      selected = { candidate, onchain };
      break;
    }
  }
  if (!selected)
    throw new Error("No currently Trading Shannon tUSDC Event Contract is discoverable.");

  const { candidate, onchain } = selected;
  console.log({
    marketId: candidate.marketId,
    asset: candidate.asset,
    strike: candidate.strike,
    intervalSec: candidate.intervalSec,
    expiry: onchain.expiry.toString(),
    pool: onchain.pool,
    indexedPool: candidate.poolAddress,
    status: onchain.status,
    collateral: onchain.collateral,
    outcomeToken: onchain.outcomeToken,
    yesId: onchain.yesId.toString(),
    noId: onchain.noId.toString(),
  });

  if (!writeEnabled) {
    console.log(
      "Read smoke passed. Set DREAMDEX_SMOKE_WRITE=true to mint one 1e6-unit complete set.",
    );
  } else {
    const fresh = await exchange.client.getMarketOnchain(candidate.marketId);
    if (
      fresh.finalized ||
      fresh.status !== 1 ||
      fresh.expiry <= BigInt(Math.floor(Date.now() / 1000))
    ) {
      throw new Error(`Market is no longer tradable (status=${fresh.status}).`);
    }

    const amount = 1_000_000n;
    const account = privateKeyToAccount(privateKey!).address;
    const balanceParams = [fresh.yesId, fresh.noId].map((id) => ({
      outcomeToken: fresh.outcomeToken,
      account,
      id,
    }));
    const before = await Promise.all(
      balanceParams.map((params) => exchange.client.getOutcomeBalance(params)),
    );
    const tx = await exchange.trader.mintSet({
      pool: fresh.pool,
      collateral: fresh.collateral,
      amount,
    });
    if (tx.receipt.status !== "success") {
      throw new Error(`mintSet transaction ${tx.hash} reverted.`);
    }
    const after = await Promise.all(
      balanceParams.map((params) => exchange.client.getOutcomeBalance(params)),
    );
    const deltas = after.map((balance, index) => balance - before[index]!);
    if (deltas.some((delta) => delta !== amount)) {
      throw new Error(
        `mintSet ${tx.hash} succeeded but balance deltas were ${deltas.map(String).join(", ")}.`,
      );
    }

    const explorerBase =
      process.env["SOMNIA_EXPLORER_URL"] ?? "https://shannon-explorer.somnia.network";
    console.log({
      mintTxHash: tx.hash,
      explorerUrl: `${explorerBase.replace(/\/$/, "")}/tx/${tx.hash}`,
      before: before.map(String),
      after: after.map(String),
      deltas: deltas.map(String),
    });
  }
} finally {
  await Promise.race([
    exchange.close(),
    new Promise<void>((resolve) => setTimeout(resolve, 1_000)),
  ]);
}
process.exit(0);
