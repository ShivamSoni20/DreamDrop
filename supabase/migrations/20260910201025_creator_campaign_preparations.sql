create table public.campaign_preparations (
  id uuid primary key default gen_random_uuid(),
  creator_wallet text not null,
  expected_onchain_campaign_id numeric(78,0) not null,
  merkle_root text not null,
  payload_ciphertext text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index campaign_preparations_creator_idx
  on public.campaign_preparations (lower(creator_wallet));
create index campaign_preparations_expiry_idx
  on public.campaign_preparations (expires_at)
  where consumed_at is null;

alter table public.campaign_preparations enable row level security;
revoke all privileges on table public.campaign_preparations from anon, authenticated;

alter table public.campaigns
  add column mint_tx_hash text,
  add column operator_approval_tx_hash text,
  add column up_funding_tx_hash text,
  add column down_funding_tx_hash text;

alter table public.claims
  add column claim_code_ciphertext text;
