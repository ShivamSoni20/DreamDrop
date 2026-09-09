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
