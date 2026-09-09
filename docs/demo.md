# Demo runbook

1. Start in mock mode to verify the complete approved UI flow.
2. Configure live mode, Supabase, relayer, and the deployed Distributor address.
3. Fund creator Wallet A with Shannon STT and tUSDC.
4. Run the read-only DreamDEX smoke test, then the explicitly enabled write smoke test.
5. Connect Wallet A, select a structured live BTC/ETH market, mint complete sets, and fund the Distributor.
6. Open one individual claim QR with Wallet B. Previewing must not consume or reveal it.
7. Sign the claim authorization and wait for the relayer receipt and verified ERC-6909 balance.
8. Reveal the position and open the real Shannon explorer transaction.

Do not demo live mode until every live dependency is configured; it must never fall back to simulated success.
