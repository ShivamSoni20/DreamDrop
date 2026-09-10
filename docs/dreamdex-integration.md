# DreamDEX integration

The supported Event Contracts stack is `@somnia-chain/markets-sdk` 0.28.1 or newer on Somnia Shannon (chain 50312). Market discovery uses structured fields such as `marketId`, `asset`, `intervalSec`, `expiry`, `pool`, and collateral; question text is display-only.

SDK 0.28.1 exposes the production outcome-token singleton through `erc6909Abi`. The verified interface is:

```solidity
function balanceOf(address owner, uint256 id) view returns (uint256);
function allowance(address owner, address spender, uint256 id) view returns (uint256);
function isOperator(address owner, address spender) view returns (bool);
function approve(address spender, uint256 id, uint256 amount) returns (bool);
function setOperator(address spender, bool approved) returns (bool);
function transfer(address receiver, uint256 id, uint256 amount) returns (bool);
function transferFrom(address sender, address receiver, uint256 id, uint256 amount) returns (bool);
```

The Distributor uses the verified `transfer` and `transferFrom` ordering and checks their boolean results. A creator grants the Distributor access with `setOperator(distributor, true)`; operator approval covers every outcome ID on the singleton. Market identity must remain the bytes32 `marketId`: `poolAddress` is a time-varying indexer field because pools are reused across market windows. Before a write, use `getMarketOnchain(marketId)` and its canonical `pool`, `outcomeToken`, `yesId`, and `noId` values.

One whole testnet contract is 1,000,000 raw units. Complete-set minting, balances, prices, and quantities stay in bigint/raw units at the adapter boundary. Execution must re-read `getMarketOnchain` and require non-finalized status `1` immediately before minting or trading.

Run `bun run dreamdex:smoke` with `DREAMDEX_SMOKE_PRIVATE_KEY` set to a dedicated funded Shannon wallet. The default performs read-only discovery. Set `DREAMDEX_SMOKE_WRITE=true` only to mint a one-contract complete set and reconcile both outcome balances. This has not been executed without a funded wallet.

The read smoke was successfully exercised on 2026-09-11 against Trading BTC/tUSDC market `0x0000000000000000000000000000000000000000000000000000000000019651`, canonical pool `0xe66c0C1FE6a10D67Ee9772dFb881f2611F9109DC`, and outcome token `0xB52c5934113Af5c0Bb20eb3C72290C8215f755b9`. This is time-sensitive evidence, not a hard-coded market configuration. Write-mode minting remains unverified because no funded smoke-test key was configured.
