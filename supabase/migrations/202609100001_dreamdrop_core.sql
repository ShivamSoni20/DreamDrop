create extension if not exists pgcrypto;

create table public.campaigns (
  id uuid primary key default gen_random_uuid(), creator_wallet text not null,
  name text not null, market_id text not null, pool_address text not null,
  outcome_token_address text not null, collateral_address text not null,
  collateral_symbol text not null, collateral_decimals integer not null check (collateral_decimals between 0 and 36),
  budget_raw numeric(78,0) not null check (budget_raw > 0), position_size_raw numeric(78,0) not null check (position_size_raw > 0),
  total_drops integer not null check (total_drops > 0), claimed_drops integer not null default 0 check (claimed_drops >= 0),
  merkle_root text not null, status text not null, market_expiry timestamptz not null,
  interval_sec integer not null check (interval_sec > 0), created_at timestamptz not null default now(),
  creation_tx_hash text, funding_tx_hash text
);

create table public.claims (
  id uuid primary key default gen_random_uuid(), campaign_id uuid not null references public.campaigns(id) on delete cascade,
  claim_index integer not null check (claim_index >= 0), side text not null check (side in ('UP','DOWN')),
  token_id numeric(78,0) not null, amount_raw numeric(78,0) not null check (amount_raw > 0),
  secret_hash text not null unique, leaf_hash text not null, claimed boolean not null default false,
  recipient_wallet text, claim_tx_hash text, claimed_at timestamptz,
  unique (campaign_id, claim_index)
);

create table public.positions (
  id uuid primary key default gen_random_uuid(), campaign_id uuid not null references public.campaigns(id),
  claim_id uuid not null unique references public.claims(id), owner_wallet text not null, market_id text not null,
  token_id numeric(78,0) not null, side text not null check (side in ('UP','DOWN')),
  amount_raw numeric(78,0) not null check (amount_raw > 0), status text not null,
  claim_tx_hash text, cashout_tx_hash text, redemption_tx_hash text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.relayer_requests (
  id uuid primary key default gen_random_uuid(), claim_id uuid not null references public.claims(id),
  wallet text not null, nonce text not null, challenge text not null, signature text,
  deadline timestamptz not null, status text not null, tx_hash text, created_at timestamptz not null default now(),
  unique (wallet, nonce)
);

create index campaigns_creator_idx on public.campaigns (lower(creator_wallet));
create index campaigns_market_idx on public.campaigns (market_id);
create index claims_campaign_claimed_idx on public.claims (campaign_id, claimed);
create index positions_owner_idx on public.positions (lower(owner_wallet));

alter table public.campaigns enable row level security;
alter table public.claims enable row level security;
alter table public.positions enable row level security;
alter table public.relayer_requests enable row level security;

-- Intentionally no browser policies: claim secrets and wallet-linked state are server-only.
-- The backend uses the service role after verifying wallet signatures and ownership.
revoke all on public.campaigns, public.claims, public.positions, public.relayer_requests from anon, authenticated;
