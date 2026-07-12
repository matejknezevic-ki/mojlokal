-- Waiter-facing features: earnings, tips, shift swaps, time-off requests,
-- handover notes, calendar feed tokens, push subscriptions.

-- Hourly wage (optional, set by owner) + stable token for the personal iCal feed
alter table waiters
  add column hourly_rate numeric(8,2),
  add column calendar_token uuid not null default gen_random_uuid();
create unique index waiters_calendar_token_idx on waiters(calendar_token);

-- Handover note written at shift end, shown to the next shift
alter table shift_sessions add column handover_note text;

-- Private tip diary — visible ONLY to the waiter (no owner RLS policy on purpose;
-- access happens exclusively through waiter API routes via service role).
create table tips (
  id         uuid primary key default gen_random_uuid(),
  venue_id   uuid not null references venues(id) on delete cascade,
  waiter_id  uuid not null references waiters(id) on delete cascade,
  shift_session_id uuid references shift_sessions(id) on delete set null,
  amount     numeric(8,2) not null check (amount >= 0),
  tip_date   date not null default current_date,
  created_at timestamptz not null default now()
);
create index tips_waiter_idx on tips(waiter_id, tip_date desc);
alter table tips enable row level security;
-- no policies: anon/authenticated see nothing; service role bypasses RLS.

-- Specific-date time-off requests ("wunschfrei"), approved by the owner
create table time_off_requests (
  id         uuid primary key default gen_random_uuid(),
  venue_id   uuid not null references venues(id) on delete cascade,
  waiter_id  uuid not null references waiters(id) on delete cascade,
  off_date   date not null,
  note       text,
  status     text not null default 'pending' check (status in ('pending','approved','denied')),
  created_at timestamptz not null default now(),
  unique (waiter_id, off_date)
);
create index time_off_venue_idx on time_off_requests(venue_id, status, off_date);
alter table time_off_requests enable row level security;
create policy "owner all" on time_off_requests for all
  using (venue_id in (select owner_venue_ids()))
  with check (venue_id in (select owner_venue_ids()));

-- Shift swap requests: a waiter offers a shift; a colleague accepts; the owner approves.
create table swap_requests (
  id             uuid primary key default gen_random_uuid(),
  venue_id       uuid not null references venues(id) on delete cascade,
  shift_id       uuid not null references shifts(id) on delete cascade,
  from_waiter_id uuid not null references waiters(id) on delete cascade,
  to_waiter_id   uuid references waiters(id) on delete set null, -- filled when a colleague accepts
  status         text not null default 'open' check (status in ('open','accepted','approved','rejected','cancelled')),
  created_at     timestamptz not null default now()
);
create index swap_requests_venue_idx on swap_requests(venue_id, status);
alter table swap_requests enable row level security;
create policy "owner all" on swap_requests for all
  using (venue_id in (select owner_venue_ids()))
  with check (venue_id in (select owner_venue_ids()));

-- Web push subscriptions per waiter
create table push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  venue_id   uuid not null references venues(id) on delete cascade,
  waiter_id  uuid not null references waiters(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
create index push_subscriptions_waiter_idx on push_subscriptions(waiter_id);
alter table push_subscriptions enable row level security;
-- no owner policy: managed exclusively via service role.
