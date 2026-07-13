-- 5-day trial + subscription gate
alter table venues
  add column trial_ends_at timestamptz not null default (now() + interval '5 days'),
  add column subscription_status text not null default 'trial'
    check (subscription_status in ('trial', 'active', 'blocked'));

-- Existing venues owned by the operator stay active (no self-paywall).
update venues set subscription_status = 'active'
where owner_id in (
  select id from auth.users
  where email in ('matej@mk-ki.at', 'matej_knezevic@yahoo.de')
);
