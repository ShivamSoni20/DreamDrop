# Production deployment

## Status

**PUBLIC DEPLOYMENT BLOCKED.** The repository builds a Cloudflare Workers-compatible Nitro bundle, but this environment has no authenticated Cloudflare account, deployment token, Worker name/domain decision, or final HTTPS origin. No production URL has been fabricated.

## Existing deployment target

`bun run build` produces the Cloudflare module worker in `.output/server` and public assets in `.output/public`. Keep that existing target rather than migrating providers for submission.

## Required production values

Public build variables:

```text
VITE_DATA_MODE=live
VITE_CHAIN_ID=50312
VITE_RPC_URL=https://dream-rpc.somnia.network
VITE_DREAMDEX_API_URL=https://stg.api.dreamdex.io/v0
VITE_DREAMDEX_INDEXER_URL=https://dev.smk.somnia.host/v1/graphql
VITE_SOMNIA_WS_RPC_URL=wss://api.infra.testnet.somnia.network/ws
VITE_RELAYER_API_URL=/api
VITE_EXPLORER_URL=https://shannon-explorer.somnia.network
VITE_APP_URL=https://<final-hostname>
VITE_DREAMDROP_DISTRIBUTOR_ADDRESS=0x7ACd0C1498e3C7210150D077a5b876E6952E3b81
```

Server-only secrets and configuration:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
RELAYER_PRIVATE_KEY
SOMNIA_RPC_URL=https://dream-rpc.somnia.network
DREAMDEX_INDEXER_URL=https://dev.smk.somnia.host/v1/graphql
SOMNIA_WS_RPC_URL=wss://api.infra.testnet.somnia.network/ws
DREAMDROP_DISTRIBUTOR_ADDRESS=0x7ACd0C1498e3C7210150D077a5b876E6952E3b81
CLAIM_SIGNING_SECRET
```

`CLAIM_SIGNING_SECRET` must contain at least 32 bytes of cryptographically random material. Never prefix server-only values with `VITE_`, commit them, paste them into build logs, or expose them as browser variables.

## Owner deployment steps

1. Create or select the Cloudflare Workers project and final HTTPS hostname.
2. Authenticate Wrangler locally or configure a least-privilege `CLOUDFLARE_API_TOKEN` in the deployment environment.
3. Set the public build variables, especially `VITE_DATA_MODE=live` and the exact final `VITE_APP_URL`, before building.
4. Add every server-only value as an encrypted Worker secret. Do not place service-role or private keys in public build variables.
5. Run the full local gate:

   ```bash
   bun install --frozen-lockfile
   bun run typecheck
   bun run lint
   bun run test
   bun run build
   ```

6. Preview the exact build with `bunx vite preview` and confirm live mode fails clearly if any secret is intentionally omitted.
7. Deploy the prebuilt Nitro worker with the repository-supported command:

   ```bash
   bunx nitro deploy --prebuilt
   ```

8. Set the final custom domain, then rebuild if its URL differs from `VITE_APP_URL`.
9. Verify `/`, `/explore`, `/create`, `/dashboard`, an individual `/claim/<private-code>`, `/my-drops`, and `/position/<id>` on the public origin.
10. Run one Wallet A → Wallet B claim and verify the explorer receipt, `DropClaimed` event, recipient balance delta, and Supabase rows before publishing the demo link.

## Release checks

- View the built client assets and confirm no service-role key, relayer key, or claim secret is present.
- Confirm the claim page emits `noindex,nofollow`.
- Confirm creator and owner reads require wallet signatures.
- Confirm the Worker can reach Supabase, Shannon RPC, DreamDEX indexer, and WebSocket RPC.
- Confirm relayer Wallet C retains enough STT for the planned demo claims.
