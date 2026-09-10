# Claim security

Each public claim code resolves only to a safe preview. The preview never returns side, token ID, amount in raw units, secret, proof, or hidden outcome metadata.

The server generates claim codes and 32-byte secrets with Node's cryptographically secure random source. URLs contain the raw bearer code, while persistent lookup uses its SHA-256 hash. Claim secrets are encrypted with AES-256-GCM under `CLAIM_SIGNING_SECRET`; the leaf commits to campaign ID, claim index, token ID, amount, and the ABI-encoded secret hash. Only the Merkle root is stored on-chain.

Claims use a random 256-bit nonce and short-lived recipient authorization bound to campaign, claim index, recipient, chain ID, deadline, and the deployed Distributor. The server reconstructs typed data from persisted state and independently recovers the signer. An atomic database reservation prevents concurrent relayer requests; the contract remains final replay protection. The relayer requires a successful receipt, the exact `DropClaimed` event, and an exact recipient balance delta before revealing the side.

All claim-related tables have RLS enabled and no browser grants. A server-only Supabase service role is required; it must never be exposed through a `VITE_` environment variable. Mock mode does not initialize Supabase.
