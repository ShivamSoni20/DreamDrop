# Demo runbook

1. Start in mock mode to verify the complete approved UI flow.
2. Configure live mode, Supabase, relayer, a strong claim-encryption secret, and the deployed Distributor address.
3. Fund creator Wallet A with Shannon STT and tUSDC.
4. Run the read-only DreamDEX smoke test, then the explicitly enabled write smoke test.
5. Connect Wallet A, select a structured live BTC/ETH market, mint complete sets, and fund the Distributor.
6. Open one individual claim QR with Wallet B. Previewing must not consume or reveal it.
7. Sign the claim authorization and wait for the relayer receipt and verified ERC-6909 balance.
8. Reveal the position and open the real Shannon explorer transaction.
9. If the market has full-fill liquidity, cash out and verify the fill transaction; otherwise show the honest hold-until-settlement state.
10. For a finalized winner or void, redeem and verify the collateral delta and transaction.

Do not demo live mode until every live dependency is configured; it must never fall back to simulated success.

The Supabase migrations are applied, server-only privileges are verified, and the Distributor is deployed at `0x7ACd0C1498e3C7210150D077a5b876E6952E3b81`. Remaining external prerequisites are Creator Wallet A with STT and supported tUSDC, a distinct Recipient Wallet B, a public HTTPS application origin, and production hosting credentials. Live paths fail closed when any prerequisite is absent.
