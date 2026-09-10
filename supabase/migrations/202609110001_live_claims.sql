alter table public.campaigns
  add column onchain_campaign_id numeric(78,0),
  add column asset text,
  add column message text not null default '',
  add column yes_token_id numeric(78,0),
  add column no_token_id numeric(78,0);

create unique index campaigns_onchain_id_idx
  on public.campaigns (onchain_campaign_id)
  where onchain_campaign_id is not null;

alter table public.claims
  add column claim_code_hash text,
  add column secret_ciphertext text,
  add column merkle_proof jsonb,
  add column reservation_id uuid,
  add column reserved_until timestamptz;

create unique index claims_code_hash_idx
  on public.claims (claim_code_hash)
  where claim_code_hash is not null;

alter table public.relayer_requests
  add column typed_data jsonb,
  add column recipient_balance_before numeric(78,0),
  add column used_at timestamptz;

alter table public.relayer_requests
  add constraint relayer_request_status_check
  check (status in ('PENDING', 'RESERVED', 'SUBMITTED', 'CONFIRMED', 'FAILED', 'EXPIRED'));

-- These tables contain bearer-code and wallet-linked data. Only the server's
-- secret/service-role client may access them; browser roles receive no grants.
revoke all privileges on table public.campaigns, public.claims, public.positions,
  public.relayer_requests from anon, authenticated;

create or replace function public.reserve_dreamdrop_claim(
  p_claim_id uuid, p_request_id uuid, p_reserved_until timestamptz
) returns boolean
language plpgsql
set search_path = public
as $$
begin
  update public.claims
  set reservation_id = p_request_id, reserved_until = p_reserved_until
  where id = p_claim_id
    and claimed = false
    and (reservation_id is null or reserved_until < now() or reservation_id = p_request_id);
  return found;
end;
$$;

revoke all on function public.reserve_dreamdrop_claim(uuid, uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.reserve_dreamdrop_claim(uuid, uuid, timestamptz) to service_role;
