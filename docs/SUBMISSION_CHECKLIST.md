# Submission checklist

## CODEX-COMPLETED

- [x] Repository audited at the verified starting HEAD
- [x] DreamDropDistributor test suite passes
- [x] Distributor deployed and bytecode/EIP-712 values verified on Shannon
- [x] Current Trading DreamDEX Event Contract read smoke passes
- [x] Supabase migrations, schema, RLS, grants, reservation RPC, and advisors verified
- [x] Creator orchestration, secure claim, relayer, dashboard, position, cash-out, settlement, and redemption code implemented
- [x] Local claim-encryption secret rotated to production-grade entropy without committing it
- [x] README and architecture/security/integration documentation reconciled
- [x] SDK/docs feedback prepared
- [x] Judge-facing submission copy prepared
- [x] Deterministic 2–3 minute demo script prepared
- [x] Production deployment handoff documented
- [ ] Real Wallet A → Wallet B campaign and claim executed
- [ ] Public production application deployed and smoke-tested

## HUMAN-REQUIRED

- [ ] Provide Codex or the deployment environment access to distinct funded Wallet A and Wallet B without sharing seed phrases
- [ ] Fund Wallet A with Shannon STT and supported DreamDEX tUSDC
- [ ] Provide a dedicated funded smoke key if separate write-smoke evidence is desired
- [ ] Select/authenticate the Cloudflare Workers project and final HTTPS domain
- [ ] Configure encrypted production secrets and `VITE_APP_URL`
- [ ] Execute and record the real campaign/claim flow using the private runbook
- [ ] Record and upload the 2–3 minute demo video
- [ ] Capture/select final screenshots with no private claim URL visible
- [ ] Replace the demo-video placeholder in `SUBMISSION.md`
- [ ] Verify every public repository, app, explorer, feedback, and video link
- [ ] Enter and submit the DoraHacks/hackathon form before the deadline
