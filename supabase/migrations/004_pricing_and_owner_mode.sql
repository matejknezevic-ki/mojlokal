-- Free access status, early-bird discount, owner-as-waiter mode

-- 'free' = permanently free venue (granted by the operator)
alter table venues drop constraint venues_subscription_status_check;
alter table venues add constraint venues_subscription_status_check
  check (subscription_status in ('trial', 'active', 'blocked', 'free'));

alter table venues
  add column early_bird boolean not null default false,
  add column discount_code text;

-- The owner can work shifts too: his waiter row is flagged.
alter table waiters add column is_owner boolean not null default false;
