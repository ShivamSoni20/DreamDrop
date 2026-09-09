# DreamDEX integration

The supported Event Contracts stack is `@somnia-chain/markets-sdk` 0.28.1 or newer on Somnia Shannon (chain 50312). Market discovery uses structured fields such as `marketId`, `asset`, `intervalSec`, `expiry`, `pool`, and collateral; question text is display-only.

One whole testnet contract is 1,000,000 raw units. Complete-set minting, balances, prices, and quantities stay in bigint/raw units at the adapter boundary. Execution must re-read `getMarketOnchain` and require non-finalized status `1` immediately before minting or trading.

Run `bun run dreamdex:smoke` with `DREAMDEX_SMOKE_PRIVATE_KEY` set to a dedicated funded Shannon wallet. The default performs read-only discovery. Set `DREAMDEX_SMOKE_WRITE=true` only to mint a one-contract complete set and reconcile both outcome balances. This has not been executed without a funded wallet.
