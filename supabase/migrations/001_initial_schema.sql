-- mojlokal initial schema
-- Multi-tenant café staff management: venues (tenants) owned by auth.users,
-- waiters authenticate via PIN through the app server (service role), never directly.

create table venues (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references auth.users(id) on delete cascade,
  name           text not null,
  slug           text not null unique,
  owner_name     text,
  opening_days   int[] not null default '{1,2,3,4,5,6,7}', -- ISO weekday, 1 = Monday
  default_locale text not null default 'hr' check (default_locale in ('hr','de')),
  currency       text not null default 'EUR',
  onboarded_at   timestamptz,
  created_at     timestamptz not null default now()
);
create index venues_owner_idx on venues(owner_id);

create table waiters (
  id                     uuid primary key default gen_random_uuid(),
  venue_id               uuid not null references venues(id) on delete cascade,
  name                   text not null,
  pin_hash               text not null,
  target_shifts_per_week int not null default 5 check (target_shifts_per_week between 0 and 14),
  availability           jsonb not null default '{}', -- {"1": false} = unavailable on Mondays
  active                 boolean not null default true,
  failed_pin_attempts    int not null default 0,
  locked_until           timestamptz,
  created_at             timestamptz not null default now(),
  unique (venue_id, name)
);
create index waiters_venue_idx on waiters(venue_id);

create table shift_templates (
  id         uuid primary key default gen_random_uuid(),
  venue_id   uuid not null references venues(id) on delete cascade,
  name       text not null,
  start_time time not null,
  end_time   time not null,
  position   int not null default 0,
  active     boolean not null default true
);
create index shift_templates_venue_idx on shift_templates(venue_id);

create table checklist_items (
  id       uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues(id) on delete cascade,
  label    text not null,
  position int not null default 0,
  active   boolean not null default true
);
create index checklist_items_venue_idx on checklist_items(venue_id);

create table schedules (
  id           uuid primary key default gen_random_uuid(),
  venue_id     uuid not null references venues(id) on delete cascade,
  week_start   date not null, -- always a Monday
  status       text not null default 'draft' check (status in ('draft','published')),
  generated_by text not null default 'manual' check (generated_by in ('manual','ai','fallback')),
  ai_notes     text,
  created_at   timestamptz not null default now(),
  unique (venue_id, week_start)
);

create table shifts (
  id          uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references schedules(id) on delete cascade,
  venue_id    uuid not null references venues(id) on delete cascade,
  waiter_id   uuid not null references waiters(id) on delete cascade,
  template_id uuid references shift_templates(id) on delete set null,
  shift_date  date not null,
  start_time  time not null,
  end_time    time not null
);
create index shifts_waiter_date_idx on shifts(waiter_id, shift_date);
create index shifts_venue_date_idx on shifts(venue_id, shift_date);
create index shifts_schedule_idx on shifts(schedule_id);

create table shift_sessions (
  id         uuid primary key default gen_random_uuid(),
  venue_id   uuid not null references venues(id) on delete cascade,
  waiter_id  uuid not null references waiters(id) on delete cascade,
  shift_id   uuid references shifts(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at   timestamptz,
  created_at timestamptz not null default now()
);
create index shift_sessions_venue_idx on shift_sessions(venue_id, started_at desc);
create index shift_sessions_waiter_open_idx on shift_sessions(waiter_id) where ended_at is null;

create table cash_counts (
  id               uuid primary key default gen_random_uuid(),
  venue_id         uuid not null references venues(id) on delete cascade,
  waiter_id        uuid not null references waiters(id) on delete cascade,
  shift_session_id uuid not null references shift_sessions(id) on delete cascade,
  amount           numeric(10,2) not null check (amount >= 0),
  note             text,
  counted_at       timestamptz not null default now()
);
create index cash_counts_venue_idx on cash_counts(venue_id, counted_at desc);

create table checklist_completions (
  id                uuid primary key default gen_random_uuid(),
  shift_session_id  uuid not null references shift_sessions(id) on delete cascade,
  checklist_item_id uuid not null references checklist_items(id) on delete cascade,
  completed_at      timestamptz not null default now(),
  unique (shift_session_id, checklist_item_id)
);

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Owners access their venue's data through the anon key (SSR client) — RLS
-- scopes everything to venues they own. Waiters have no Supabase identity:
-- all waiter traffic goes through Next.js API routes using the service role
-- key, explicitly filtered by the verified {venue_id, waiter_id} from the
-- signed waiter session cookie. The service role bypasses RLS by design.
-- ---------------------------------------------------------------------------

alter table venues enable row level security;
alter table waiters enable row level security;
alter table shift_templates enable row level security;
alter table checklist_items enable row level security;
alter table schedules enable row level security;
alter table shifts enable row level security;
alter table shift_sessions enable row level security;
alter table cash_counts enable row level security;
alter table checklist_completions enable row level security;

create function owner_venue_ids()
returns setof uuid
language sql stable security definer
set search_path = public
as $$ select id from venues where owner_id = auth.uid() $$;

create policy "owner all" on venues for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "owner all" on waiters for all
  using (venue_id in (select owner_venue_ids()))
  with check (venue_id in (select owner_venue_ids()));

create policy "owner all" on shift_templates for all
  using (venue_id in (select owner_venue_ids()))
  with check (venue_id in (select owner_venue_ids()));

create policy "owner all" on checklist_items for all
  using (venue_id in (select owner_venue_ids()))
  with check (venue_id in (select owner_venue_ids()));

create policy "owner all" on schedules for all
  using (venue_id in (select owner_venue_ids()))
  with check (venue_id in (select owner_venue_ids()));

create policy "owner all" on shifts for all
  using (venue_id in (select owner_venue_ids()))
  with check (venue_id in (select owner_venue_ids()));

create policy "owner all" on shift_sessions for all
  using (venue_id in (select owner_venue_ids()))
  with check (venue_id in (select owner_venue_ids()));

create policy "owner all" on cash_counts for all
  using (venue_id in (select owner_venue_ids()))
  with check (venue_id in (select owner_venue_ids()));

create policy "owner all" on checklist_completions for all
  using (shift_session_id in (
    select id from shift_sessions where venue_id in (select owner_venue_ids())
  ))
  with check (shift_session_id in (
    select id from shift_sessions where venue_id in (select owner_venue_ids())
  ));

-- ---------------------------------------------------------------------------
-- end_shift: atomic shift close. Validates that every active checklist item
-- is checked and a cash amount is provided, then records everything in one
-- transaction. Called via service role RPC from /api/waiter/shift/end.
-- ---------------------------------------------------------------------------

create function end_shift(
  p_session_id uuid,
  p_waiter_id uuid,
  p_venue_id uuid,
  p_amount numeric,
  p_note text,
  p_checked_item_ids uuid[]
)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_session shift_sessions%rowtype;
  v_missing int;
  v_item uuid;
begin
  select * into v_session
  from shift_sessions
  where id = p_session_id
    and waiter_id = p_waiter_id
    and venue_id = p_venue_id
    and ended_at is null
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'no_open_shift');
  end if;

  if p_amount is null or p_amount < 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_amount');
  end if;

  select count(*) into v_missing
  from checklist_items
  where venue_id = p_venue_id
    and active
    and id <> all (coalesce(p_checked_item_ids, '{}'));

  if v_missing > 0 then
    return jsonb_build_object('ok', false, 'error', 'checklist_incomplete', 'missing', v_missing);
  end if;

  insert into cash_counts (venue_id, waiter_id, shift_session_id, amount, note)
  values (p_venue_id, p_waiter_id, p_session_id, p_amount, nullif(trim(coalesce(p_note, '')), ''));

  foreach v_item in array coalesce(p_checked_item_ids, '{}') loop
    insert into checklist_completions (shift_session_id, checklist_item_id)
    select p_session_id, v_item
    where exists (
      select 1 from checklist_items
      where id = v_item and venue_id = p_venue_id
    )
    on conflict do nothing;
  end loop;

  update shift_sessions set ended_at = now() where id = p_session_id;

  return jsonb_build_object(
    'ok', true,
    'started_at', v_session.started_at,
    'ended_at', now()
  );
end;
$$;

-- Only the service role may call end_shift (waiter flow); owners don't need it.
revoke execute on function end_shift(uuid, uuid, uuid, numeric, text, uuid[]) from public, anon, authenticated;
