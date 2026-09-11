alter table public.positions
  add column cashout_proceeds_raw numeric(78,0),
  add column redemption_proceeds_raw numeric(78,0);
