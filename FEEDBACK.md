# DreamDEX Event Contracts SDK / Docs Feedback

This feedback comes from building DreamDrop against `@somnia-chain/markets-sdk` 0.28.1 on Somnia Shannon, including market discovery, complete-set minting, ERC-6909 custody, order-book quoting, settlement lookup, and redemption.

## What worked well

- `getMarketOnchain(marketId)` provides the canonical state needed to fail closed before writes.
- Structured fields for asset, expiry, interval, collateral, outcome token, and outcome IDs avoid brittle question-text parsing.
- `mintSet` returning both a hash and receipt makes confirmation-first orchestration straightforward.
- The SDK exposes the protocol addresses and ERC-6909 ABI required for balance and operator checks.

## Friction we encountered

Indexer results and canonical chain state serve different purposes, but the boundary is easy to miss. Discovery can begin with indexed markets, while every write still needs a fresh on-chain read. More explicit write-path examples would prevent integrations from treating a stale indexer row as authorization to transact.

## Event Contract discovery

A single helper that discovers currently Trading markets, filters supported collateral, verifies expiry headroom, and returns canonical on-chain fields would remove repeated safety code. It should return rejection reasons for indexed candidates that are expired, finalized, unsupported, or no longer Trading.

## On-chain status vs indexer state

The docs should state directly that indexer status is for discovery and UI, not transaction authorization. Our write paths re-read the market immediately before mint, cash-out, and redemption, then wait for receipts and reconcile balances.

## marketId vs recycled pool addresses

`marketId` must be documented as the durable identity. Pool addresses can roll or be reused between windows, so persisting a pool as the primary identity can reconcile a position against the wrong Event Contract.

## bigint / tick / lot handling

Protocol amounts, quantities, ticks, and lots need an end-to-end bigint example. Display decimals should be derived only at the UI boundary. A typed quote result containing raw requested quantity, fillable quantity, best executable tick, estimated proceeds, and minimum proceeds would make safe integrations easier.

## mintSet and complete-set ergonomics

The most useful missing example is: read collateral balance, read both ERC-6909 balances, call `mintSet`, assert receipt success, re-read balances, and prove both deltas equal the requested raw amount. A helper returning these verified deltas would be valuable.

## ERC-6909 outcome-token interface

Operator approval deserves explicit documentation. DreamDrop uses `setOperator(distributor, true)` and verifies `isOperator` before funding. Examples should cover `balanceOf(owner, id)`, `setOperator`, `transferFrom`, boolean return checks, and the difference between per-ID approval and global operator authorization.

## order-book / cash-out ergonomics

A documented full-position taker example would help: obtain the current book, round using protocol tick/lot rules, require full executable quantity, refresh immediately before submit, use FILL_OR_KILL, inspect actual fills, and verify the exact outcome-token balance decrease. Market probability should never be presented as executable proceeds.

## settlement / redemption ergonomics

Finalized-market examples should cover winning, losing, and void states from a durable `marketId`, followed by redemption and collateral-delta verification. A normalized settlement result would reduce application-specific status mapping.

## Documentation improvements

- Add one lifecycle example spanning discovery → mintSet → ERC-6909 balances → settlement → redemption.
- Publish the numeric status enum and finalization combinations beside each relevant method.
- Label indexer-only and canonical-on-chain fields in response examples.
- Show transaction receipt and state-delta verification, not submission hashes alone.
- Document common Shannon RPC/indexer transient failures and recommended retry boundaries.

## SDK improvements

- Provide `discoverTradableMarkets({ collateral, minHeadroom })` with canonical validation.
- Return verified balance deltas from complete-set mint helpers.
- Provide typed, bigint-native full-fill quote helpers.
- Expose a normalized settlement/redemption eligibility result.
- Include ERC-6909 operator and balance helpers alongside trading primitives.

## Example code we wish existed

```ts
const market = await markets.discoverTradableMarket({
  collateral: SOMNIA_TESTNET_ADDRESSES.testUsdc,
  minHeadroomSeconds: 90,
});

const mint = await markets.trader.mintSetVerified({
  marketId: market.marketId,
  amount: 1_000_000n,
});

if (mint.upDelta !== 1_000_000n || mint.downDelta !== 1_000_000n) {
  throw new Error("Complete-set inventory did not reconcile");
}
```

The exact method names above are suggestions, not claims about the current SDK.
