# DreamDrop submission

**Project name:** DreamDrop  
**Tagline:** Airdrops that are live predictions.  
**Core hook:** Don't ask users to buy their first prediction. Airdrop it.

## Problem

Prediction markets ask new users to bridge funds, understand odds and order books, choose a side, and trade before they experience the product. That activation path is too long for creator campaigns, events, and community growth.

## Solution

DreamDrop lets a creator turn a campaign budget into individual, one-time claims for real DreamDEX UP or DOWN outcome tokens. A recipient opens a private link, sees a safe sealed preview, connects a wallet, signs an EIP-712 authorization, and receives a gasless first position through the relayer.

## How DreamDrop works

1. Wallet A selects a current Trading DreamDEX Event Contract on Somnia Shannon.
2. The creator mints a complete set, producing equal UP and DOWN inventory.
3. DreamDrop creates encrypted claim material and commits a Merkle root to the Distributor.
4. The creator authorizes and funds per-campaign ERC-6909 inventory.
5. Each QR/link is unique, one-time, and hides its side before a confirmed claim.
6. Wallet B signs a short-lived authorization; the server reserves and relays the claim.
7. The position is revealed only after receipt, event, and exact token-balance reconciliation.
8. The owner can hold, cash out against full-fill liquidity, or redeem after finalization.

## Why Event Contracts are essential

The reward is not a point, coupon, or simulated prediction. It is a real DreamDEX Event Contract outcome token whose value follows a live market. DreamDEX supplies discovery, complete-set minting, the order book, settlement, and redemption. DreamDrop supplies the distribution and acquisition primitive.

## Why this is different

- Recipients do not fund or choose their first prediction.
- Complete-set minting gives creators balanced inventory without expressing a directional view.
- Hidden, individual claims make distribution feel like a reveal while preventing a shared-link race.
- Gasless claims remove the first-transaction barrier.
- Market probability and executable cash-out value remain explicitly separate.

## Technical architecture

TanStack Start provides the React UI and server-function boundary. The DreamDEX SDK supplies structured market and trading primitives. Viem handles wallet calls and canonical receipt/event verification. Supabase stores campaigns, encrypted claim material, reservations, relayer requests, and owner positions behind service-role-only access. `DreamDropDistributor` custodies isolated ERC-6909 campaign inventory.

## Security model

- Public previews never expose side, token ID, raw amount, secret, or Merkle proof.
- Claim codes are SHA-256 indexed and encrypted at rest; claim secrets use AES-256-GCM.
- EIP-712 binds campaign, claim index, recipient, chain ID, deadline, nonce, and Distributor.
- Expected campaign IDs prevent Merkle roots from being committed to the wrong campaign during a race.
- PostgreSQL reservation plus contract nonce/claim state provides layered replay protection.
- Success requires a confirmed receipt, matching `DropClaimed`, and exact ERC-6909 balance delta.

## Real testnet evidence

- Network: Somnia Shannon, chain ID `50312`
- Distributor: [`0x7ACd0C1498e3C7210150D077a5b876E6952E3b81`](https://shannon-explorer.somnia.network/address/0x7ACd0C1498e3C7210150D077a5b876E6952E3b81)
- Deployment transaction: [`0xa153b391098ee67884ec64a8de059aea15b0ae86b02b9ccb5cdcfe4bc1bc85e3`](https://shannon-explorer.somnia.network/tx/0xa153b391098ee67884ec64a8de059aea15b0ae86b02b9ccb5cdcfe4bc1bc85e3)
- Latest read-smoke market ID: `0x000000000000000000000000000000000000000000000000000000000001a1f4`
- Canonical pool: `0x4d0028954607A7D9C0CDc0d4a1Faf2393F519fF0`
- Outcome token: `0xB52c5934113Af5c0Bb20eb3C72290C8215f755b9`

A real campaign/recipient claim transaction is not recorded because distinct funded Wallet A and Wallet B credentials were unavailable to this execution environment. No private claim URL or unverified transaction is included.

## User and ecosystem impact

Creators can distribute market participation through conferences, community campaigns, watch parties, and social links. Every successful drop gives a new user an owned position and a reason to return for trading or settlement, turning prediction-market acquisition into distribution.

## Known limitations

- Recipient cash-out and redemption require gas; only the initial claim is relayed.
- Cash-out deliberately refuses partial fills.
- Public deployment and real Wallet A → Wallet B evidence require the owner’s hosting and wallet access.
- Operational production use should add rate limiting, monitoring, key rotation, and scheduled reconciliation.

## Links

- Repository: [github.com/ShivamSoni20/DreamDrop](https://github.com/ShivamSoni20/DreamDrop)
- Public app: pending deployment; follow [DEPLOYMENT.md](DEPLOYMENT.md)
- Demo video: `<add final public video URL>`
- SDK/docs feedback: [FEEDBACK.md](../FEEDBACK.md)
- Demo script: [DEMO_SCRIPT.md](DEMO_SCRIPT.md)
