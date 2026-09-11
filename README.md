# DreamDrop

**Airdrops that are live predictions.**

DreamDrop turns creator-funded DreamDEX Event Contract positions into secure, individual claim links and QR codes. Recipients receive a real UP or DOWN outcome token without funding their first prediction, then hold, cash out against executable liquidity, or redeem after settlement.

## Problem and solution

Prediction markets usually ask a new user to fund a wallet, understand a market and order book, pick a side, and trade before experiencing the product. DreamDrop reverses that flow: a creator mints complete sets, funds unique drops, and gives the user their first position.

## How it works

1. A creator connects an injected EVM wallet on Somnia Shannon and selects a current DreamDEX market.
2. DreamDrop validates the canonical market, mints equal UP/DOWN inventory, generates cryptographically random claims, and commits their Merkle root on-chain.
3. The creator authorizes and funds the Distributor with ERC-6909 outcome tokens.
4. Each recipient opens one private URL, connects a distinct wallet, and signs an EIP-712 authorization.
5. The server reserves the claim atomically and relays it. The UI reveals the side only after receipt, event, and exact balance-delta verification.
6. The owner can hold, execute a full-fill protected DreamDEX cash-out, or redeem a finalized winning/void position.

DreamDEX provides the prediction markets, complete-set minting, order book, settlement, and redemption primitives. Somnia provides the Shannon execution environment (chain ID `50312`) and fast on-chain confirmation.

## Architecture and tech stack

- React 19, TanStack Start/Router/Query, Tailwind CSS, and shadcn-style components
- `@somnia-chain/markets-sdk` for structured market discovery and bigint-exact writes
- `viem` for wallet, receipt, event, and contract verification
- Solidity `DreamDropDistributor` for campaign inventory, Merkle claims, EIP-712 authorization, nonce and duplicate protection
- Supabase Postgres accessed only by server functions with the service role
- AES-256-GCM encrypted claim secrets and claim codes at rest
- Bun, Vitest, Foundry, and GitHub Actions

See [architecture](docs/architecture.md), [claim security](docs/claim-security.md), and [DreamDEX integration](docs/dreamdex-integration.md).

## Smart contract and gasless claims

The Distributor holds inventory per campaign and transfers only the token ID and amount committed in a valid Merkle leaf. `createCampaign` includes an expected campaign ID guard, preventing a concurrent creator from producing a root for the wrong ID. Recipient authorizations bind campaign, claim index, recipient, chain ID, deadline, nonce, and verifying contract. Signatures enforce normalized `v` and low-`s` recovery.

The relayer never chooses the recipient: it reconstructs authorization from persisted server state, simulates the allowlisted claim, waits for a successful receipt, verifies `DropClaimed`, and reconciles the exact ERC-6909 recipient balance delta.

## Supabase architecture

`campaigns`, `claims`, `positions`, `relayer_requests`, and `campaign_preparations` have RLS enabled and no `anon` or `authenticated` table grants. The reservation RPC is executable only by `service_role`. Claim bearer codes and secrets are encrypted or hashed and never returned by public previews.

Apply migrations in filename order with the Supabase CLI or migration connector. Never expose `SUPABASE_SERVICE_ROLE_KEY` in a `VITE_*` variable.

## Local setup and environment

```bash
bun install --frozen-lockfile
copy .env.example .env
bun run dev
```

Mock mode is an explicit UI demo. For live mode configure the public Shannon/DreamDEX variables plus these server-only values:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
RELAYER_PRIVATE_KEY
SOMNIA_RPC_URL
DREAMDEX_INDEXER_URL
SOMNIA_WS_RPC_URL
DREAMDROP_DISTRIBUTOR_ADDRESS
CLAIM_SIGNING_SECRET
```

Never commit `.env`, private keys, service-role keys, signing secrets, or raw claim codes.

## Shannon deployment

```bash
forge script contracts/script/DeployDreamDropDistributor.s.sol:DeployDreamDropDistributor \
  --root contracts --rpc-url "$SOMNIA_RPC_URL" --private-key "$DEPLOYER_PRIVATE_KEY" \
  --broadcast -vvvv
bun run distributor:verify
```

The contract address and real transaction evidence are recorded in the integration documentation only after deployment succeeds.

## Testing

```bash
bun install --frozen-lockfile
bun run typecheck
bun run lint
bun run test
bun run build
forge fmt --root contracts --check
forge build --root contracts
forge test --root contracts -vvv
```

The DreamDEX smoke test is read-only by default. Write mode requires a dedicated funded testnet key and verifies exact UP/DOWN mint deltas:

```bash
bun run dreamdex:smoke
```

## Demo instructions

Use mock mode for a deterministic UI walkthrough. Use live mode only after Supabase, Distributor, relayer, app origin, and funded wallets are configured. Follow [the demo runbook](docs/demo.md); do not present a submitted transaction as success until its receipt and balance effects are verified.

## Known limitations and future work

- Recipient trading/redemption requires wallet gas; only claiming is relayed.
- Cash-out deliberately requires enough current book liquidity for the full quantity.
- Campaign creation uses a guarded expected ID and must regenerate preparation after a race.
- Production should add operational rate limiting, monitoring, key rotation, and durable background reconciliation.
- Campaign-wide “next available” QR allocation is deferred; individual one-time QR codes are safer for the MVP.

Repository: [ShivamSoni20/DreamDrop](https://github.com/ShivamSoni20/DreamDrop)  
DreamDEX: [dreamdex.io](https://dreamdex.io/)  
Somnia: [somnia.network](https://somnia.network/)
