# Claim security

Each public claim code resolves only to a safe preview. The preview never returns side, token ID, amount in raw units, secret, proof, or hidden outcome metadata.

The server generates secrets with a cryptographically secure random source and commits each leaf to campaign ID, claim index, token ID, amount, and the secret hash. Only the Merkle root is stored in the Distributor campaign.

Claims use a short-lived recipient authorization bound to campaign, claim index, recipient, chain ID, deadline, and nonce. The contract rejects reused indices, reused recipient nonces, invalid proofs, expired campaign windows, expired signatures, and recipient substitution. Relayer requests must be idempotent and transaction confirmation must precede revealing the side.

All four core tables have RLS enabled and no browser grants. A server-only Supabase service role is required; it must never be exposed through a `VITE_` environment variable.
