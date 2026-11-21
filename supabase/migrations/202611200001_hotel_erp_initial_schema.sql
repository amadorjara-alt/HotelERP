
create extension if not exists btree_gist with schema extensions;
set local search_path = public, extensions, pg_catalog;

create table public.profiles (
 id uuid primary key references auth.users on delete cascade,
 role text not null check (role in ('admin','receptionist'))
);
create table public.rooms (
 id uuid primary key default gen_random_uuid(),
 number text not null unique check (btrim(number) <> ''),
 name text not null check (btrim(name) <> ''),
 nightly_rate numeric(10,2) not null check (nightly_rate between 0 and 99999999.99)
);
create table public.guests (
 id uuid primary key default gen_random_uuid(),
 full_name text not null check (btrim(full_name) <> ''),
 document_number text not null unique check (btrim(document_number) <> ''),
 email text
);
create table public.reservations (
 id uuid primary key default gen_random_uuid(),
 room_id uuid not null references public.rooms,
 guest_id uuid not null references public.guests,
 check_in date not null,
 check_out date not null,
 status text not null default 'reserved' check (status in ('reserved','occupied','completed','cancelled')),
 nightly_rate numeric(10,2) not null check (nightly_rate between 0 and 99999999.99),
 check (isfinite(check_in) and isfinite(check_out) and check_out > check_in),
 constraint reservations_no_overlap exclude using gist
 (room_id with =, daterange(check_in, check_out, '[)') with &&)
 where (status <> 'cancelled')
);
create index on public.reservations (room_id);
create index on public.reservations (guest_id);
create table public.services (
 id uuid primary key default gen_random_uuid(),
 name text not null unique check (btrim(name) <> ''),
 price numeric(10,2) not null check (price between 0 and 99999999.99)
);
create table public.reservation_services (
 id uuid primary key default gen_random_uuid(),
 reservation_id uuid not null references public.reservations,
 service_id uuid not null references public.services,
 quantity integer not null default 1 check (quantity > 0),
 unit_price numeric(10,2) not null check (unit_price between 0 and 99999999.99)
);
create index on public.reservation_services (reservation_id);
create index on public.reservation_services (service_id);

create function public.hotel_snapshot_room_rate() returns trigger
language plpgsql set search_path = '' as $$
begin
 select nightly_rate into new.nightly_rate from public.rooms where id = new.room_id;
 return new;
end;
$$;
create function public.hotel_snapshot_service_price() returns trigger
language plpgsql set search_path = '' as $$
begin
 select price into new.unit_price from public.services where id = new.service_id;
 return new;
end;
$$;
revoke execute on function public.hotel_snapshot_room_rate(), public.hotel_snapshot_service_price()
from public, anon, authenticated;
create trigger hotel_snapshot_room_rate before insert on public.reservations
for each row execute function public.hotel_snapshot_room_rate();
create trigger hotel_snapshot_service_price before insert on public.reservation_services
for each row execute function public.hotel_snapshot_service_price();

alter table public.profiles enable row level security;
revoke all on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
create policy profile_read_self on public.profiles for select to authenticated
using (id = (select auth.uid()));

do $$
declare target text;
begin
 foreach target in array array['rooms','guests','reservations','services','reservation_services'] loop
  execute format('alter table public.%I enable row level security', target);
  execute format('revoke all on public.%I from public, anon, authenticated', target);
  execute format('grant select on public.%I to authenticated', target);
  execute format('create policy staff_read on public.%I for select to authenticated using ((select exists (select 1 from public.profiles where id = (select auth.uid()))))', target);
 end loop;
 foreach target in array array['rooms','services'] loop
  execute format('grant insert, update on public.%I to authenticated', target);
  execute format('create policy admin_insert on public.%I for insert to authenticated with check ((select exists (select 1 from public.profiles where id = (select auth.uid()) and role = ''admin'')))', target);
  execute format('create policy admin_update on public.%I for update to authenticated using ((select exists (select 1 from public.profiles where id = (select auth.uid()) and role = ''admin''))) with check ((select exists (select 1 from public.profiles where id = (select auth.uid()) and role = ''admin'')))', target);
 end loop;
 foreach target in array array['guests','reservations','reservation_services'] loop
  execute format('create policy staff_insert on public.%I for insert to authenticated with check ((select exists (select 1 from public.profiles where id = (select auth.uid()))))', target);
 end loop;
 foreach target in array array['guests','reservations'] loop
  execute format('create policy staff_update on public.%I for update to authenticated using ((select exists (select 1 from public.profiles where id = (select auth.uid())))) with check ((select exists (select 1 from public.profiles where id = (select auth.uid()))))', target);
 end loop;
end;
$$;
grant insert (full_name, document_number, email), update (full_name, document_number, email)
on public.guests to authenticated;
grant insert (room_id, guest_id, check_in, check_out), update (status)
on public.reservations to authenticated;
grant insert (reservation_id, service_id, quantity) on public.reservation_services to authenticated;

create view public.reservation_totals with (security_invoker = true) as
select r.id as reservation_id, (r.check_out - r.check_in) as nights,
 r.nightly_rate, (r.check_out - r.check_in) * r.nightly_rate as lodging_total,
 coalesce(s.total, 0) as services_total,
 (r.check_out - r.check_in) * r.nightly_rate + coalesce(s.total, 0) as total
from public.reservations r
left join lateral (
 select sum(rs.quantity * rs.unit_price) as total
 from public.reservation_services rs where rs.reservation_id = r.id
) s on true
where r.status <> 'cancelled';
revoke all on public.reservation_totals from public, anon, authenticated;
grant select on public.reservation_totals to authenticated;

