# DreamDrop implementation checklist

## P0 — required vertical slice

- [x] Baseline source fixes: complete status coverage, query callbacks, cash-out reset
- [x] Structured market interval and dynamic campaign headroom
- [x] Integer-safe protocol model boundary
- [x] Real injected wallet connection and Shannon network switching in live mode
- [x] Standalone DreamDEX market/read/mint/balance smoke script
- [x] ERC-6909 Distributor with Merkle claims and recipient authorization
- [x] PostgreSQL/Supabase schema with RLS-denied browser access
- [x] Distributor contract tests (31 passing Foundry tests)
- [x] Live/mock DreamDEX adapter isolation and structured Shannon normalization
- [x] Server-only Supabase repositories and follow-up claim migration
- [x] Secure claim codes, encrypted secrets, Solidity-compatible Merkle generation and proofs
- [x] Persisted, server-authoritative EIP-712 challenges and signature verification
- [x] Relayer implementation with reservation, receipt/event checks, and exact balance reconciliation
- [x] Foundry Shannon deployment script
- [ ] Deploy Distributor to Shannon and record address/transaction
- [x] Guard campaign IDs against concurrent preparation races
- [x] Wire creator mint/fund transactions to the approved UI
- [x] Apply Supabase migrations and verify server-only RLS/grants
- [ ] Execute and verify the relayer recipient balance check on Shannon

## P1

- [x] Full-fill protected cash-out with on-chain market revalidation
- [x] Finalized-market lookup and settlement reconciliation
- [x] Winner/void redemption
- [x] Wallet-authorized live campaign and position reads
- [ ] Campaign analytics and printable individual QR pack

## P2

- [x] CI skeleton for app and contracts
- [x] Complete README and integration/security/demo docs
- [x] Shannon explorer URL helpers
- [x] Deployment configuration and executable Foundry deployment command
- [ ] Responsive end-to-end QA with funded Wallet A and distinct Wallet B

Items requiring credentials or funds must remain unchecked until actually exercised. Live mode must fail clearly rather than fall back to mock data.
