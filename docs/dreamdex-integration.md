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

Run `bun run dreamdex:smoke` with `DREAMDEX_SMOKE_PRIVATE_KEY` set to a dedicated funded Shannon wallet. The default performs read-only discovery. Set `DREAMDEX_SMOKE_WRITE=true` only to mint a one-contract complete set and reconcile both outcome balances.

The latest successful read smoke on 2026-09-11 resolved Trading BTC/tUSDC market `0x000000000000000000000000000000000000000000000000000000000001971f`, canonical pool `0x69E62A394Ee036FfDc867E2C7d689D5B65144a80`, outcome token `0xB52c5934113Af5c0Bb20eb3C72290C8215f755b9`, YES ID ending `8112`, and NO ID ending `8113`. This is time-sensitive evidence, not hard-coded configuration. Write-mode minting remains unverified because no dedicated smoke-test key was configured.

Cash-out reads the current canonical market and order book, applies the SDK's tick/lot-aware sell quote, and requires `fillableQuantity == quantity`. Submission uses `ORDER_TYPE.FILL_OR_KILL`, confirmed fill totals, and the exact outcome-token balance decrease. Redemption requires a finalized resolved/void market and verifies that collateral increased. All authoritative order values remain bigint raw units.

Deploy the tested Distributor only with a dedicated funded Shannon deployer:

```bash
forge script contracts/script/DeployDreamDropDistributor.s.sol:DeployDreamDropDistributor --root contracts --rpc-url shannon --private-key "$DEPLOYER_PRIVATE_KEY" --broadcast -vvvv
```

Verified Shannon deployment (chain `50312`):

- Distributor: [`0x7ACd0C1498e3C7210150D077a5b876E6952E3b81`](https://shannon-explorer.somnia.network/address/0x7ACd0C1498e3C7210150D077a5b876E6952E3b81)
- Deployment transaction: [`0xa153b391098ee67884ec64a8de059aea15b0ae86b02b9ccb5cdcfe4bc1bc85e3`](https://shannon-explorer.somnia.network/tx/0xa153b391098ee67884ec64a8de059aea15b0ae86b02b9ccb5cdcfe4bc1bc85e3)
- Deployer/relayer Wallet C: `0x7adfC0d7E2df25998f5978e029D310b7CEfc8F4A`

`bun run distributor:verify` confirmed 3,835 bytes of deployed bytecode plus the expected on-chain EIP-712 domain separator and claim typehash.
