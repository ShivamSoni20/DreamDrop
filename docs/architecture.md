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

Server-only modules live under `src/server`. Public claim services cross the TanStack Start server-function boundary; browser bundles receive safe previews and typed data, never the Supabase service key, relayer key, Merkle proof, token side, or encrypted secret. The live relayer reserves a claim in Postgres before submitting and persists a position only after receipt, event, and balance reconciliation.
