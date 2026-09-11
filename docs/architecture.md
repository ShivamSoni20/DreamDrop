# DreamDrop architecture

DreamDrop is a distribution layer for DreamDEX Event Contract outcome tokens. It does not create or resolve markets.

```mermaid
flowchart LR
  C[Creator wallet] --> UI[TanStack Start UI]
  UI --> DX[DreamDEX markets SDK]
  DX --> EC[DreamDEX Event Contract]
  UI --> API[Server functions / API]
  API --> DB[(Supabase Postgres)]
  API --> R[Relayer]
  R --> DD[DreamDropDistributor]
  EC --> DD
  DD --> W[Recipient wallet]
```

Mock mode is an intentional, isolated demo. Live mode uses injected wallet state, Shannon chain state, server persistence, and real receipts; it must never synthesize successful hashes or balances.

The database is not authoritative for blockchain facts. Writes revalidate market state, and confirmed actions reconcile transaction receipts and outcome-token balances before application state advances.

Creator preparation is server-authoritative. It reads the current canonical market and Distributor `nextCampaignId`, generates encrypted claim material for that ID, and returns only the root and transaction inputs. `createCampaign` requires the same expected ID on-chain, so a competing creation reverts instead of accepting a mismatched root. The application persists `LIVE` only after mint, creation, operator approval, both funding events, and inventory all reconcile.

Server-only modules live under `src/server`. Public claim services cross the TanStack Start server-function boundary; browser bundles receive safe previews and typed data, never the Supabase service key, relayer key, Merkle proof, token side, or encrypted secret. The live relayer reserves a claim in Postgres before submitting and persists a position only after receipt, event, and balance reconciliation.

Creator dashboards and owner positions use short-lived wallet-signed read proofs. Server queries enforce creator/owner filters before returning private claim links or wallet-linked data. Settlement reconciliation reads the durable DreamDEX `marketId`, updates resolving/win/loss/void states, and never treats a recycled pool address as market identity.
