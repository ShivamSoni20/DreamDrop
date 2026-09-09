# DreamDrop implementation checklist

## P0 — required vertical slice

- [x] Baseline source fixes: complete status coverage, query callbacks, cash-out reset
- [x] Structured market interval and dynamic campaign headroom
- [x] Integer-safe protocol model boundary
- [x] Real injected wallet connection and Shannon network switching in live mode
- [x] Standalone DreamDEX market/read/mint/balance smoke script
- [x] ERC-6909 Distributor with Merkle claims and recipient authorization
- [x] PostgreSQL/Supabase schema with RLS-denied browser access
- [ ] Distributor contract tests
- [ ] Deploy Distributor to Shannon and record address/transaction
- [ ] Persistent server repositories and wallet-authenticated endpoints
- [ ] Secure claim generation, proofs, challenge storage, and idempotent relayer
- [ ] Wire creator mint/fund transactions to the approved UI
- [ ] Verify recipient outcome-token balance after claim

## P1

- [ ] Full-fill IOC cash-out with on-chain market revalidation
- [ ] Finalized-market lookup and settlement reconciliation
- [ ] Winner/void redemption
- [ ] Campaign analytics and printable individual QR pack

## P2

- [x] CI skeleton for app and contracts
- [ ] Complete README and integration/security/demo docs
- [x] Shannon explorer URL helpers
- [ ] Deployment configuration and responsive end-to-end QA

Items requiring credentials or funds must remain unchecked until actually exercised. Live mode must fail clearly rather than fall back to mock data.
