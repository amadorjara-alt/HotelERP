create table public.hotels (
 id uuid primary key default gen_random_uuid(),
 name text not null check (char_length(btrim(name)) between 2 and 100)
);
create table public.customers (
 id uuid primary key references auth.users on delete cascade,
 full_name text not null check (char_length(btrim(full_name)) between 2 and 120)
);
create table public.staff_invites (
 code uuid primary key default gen_random_uuid(),
 hotel_id uuid not null references public.hotels,
 expires_at timestamptz not null default (now() + interval '24 hours')
);

insert into public.hotels (id,name) values ('7bb22036-f725-489d-ac29-130c5872cc32','Hotel de demostración');
do $$
declare target text;
begin
 foreach target in array array['profiles','rooms','guests','reservations','services','reservation_services'] loop
  execute format('alter table public.%I add column hotel_id uuid references public.hotels',target);
  execute format('update public.%I set hotel_id = %L',target,'7bb22036-f725-489d-ac29-130c5872cc32');
  execute format('alter table public.%I alter column hotel_id set not null',target);
  execute format('create index on public.%I (hotel_id)',target);
 end loop;
end $$;
alter table public.rooms drop constraint rooms_number_key, add unique(hotel_id,number), add unique(hotel_id,id);
alter table public.guests drop constraint guests_document_number_key, add unique(hotel_id,document_number), add unique(hotel_id,id);
alter table public.services drop constraint services_name_key, add unique(hotel_id,name), add unique(hotel_id,id);
alter table public.reservations add unique(hotel_id,id);
alter table public.reservations
 drop constraint reservations_room_id_fkey,
 drop constraint reservations_guest_id_fkey,
 add foreign key(hotel_id,room_id) references public.rooms(hotel_id,id),
 add foreign key(hotel_id,guest_id) references public.guests(hotel_id,id);
alter table public.reservation_services
 drop constraint reservation_services_reservation_id_fkey,
 drop constraint reservation_services_service_id_fkey,
 add foreign key(hotel_id,reservation_id) references public.reservations(hotel_id,id),
 add foreign key(hotel_id,service_id) references public.services(hotel_id,id);

alter table public.hotels enable row level security;
alter table public.customers enable row level security;
alter table public.staff_invites enable row level security;
revoke all on public.hotels,public.customers,public.staff_invites from public,anon,authenticated;
grant select on public.hotels,public.customers to authenticated;
create policy hotel_staff on public.hotels for select to authenticated
using (id = (select hotel_id from public.profiles where id = (select auth.uid())));
create policy customer_self on public.customers for select to authenticated using (id = (select auth.uid()));

create function public.hotel_current_id() returns uuid
language sql stable security invoker set search_path = '' as $$
 select hotel_id from public.profiles where id = (select auth.uid());
$$;
revoke all on function public.hotel_current_id() from public,anon,authenticated;
grant execute on function public.hotel_current_id() to authenticated;
do $$
declare target text;
begin
 foreach target in array array['rooms','guests','reservations','services','reservation_services'] loop
  execute format('alter table public.%I alter column hotel_id set default public.hotel_current_id()', target);
  execute format('drop policy staff_read on public.%I',target);
  execute format('create policy staff_read on public.%I for select to authenticated using (hotel_id = (select public.hotel_current_id()))',target);
 end loop;
 foreach target in array array['guests','reservations','reservation_services'] loop
  execute format('drop policy staff_insert on public.%I',target);
  execute format('create policy staff_insert on public.%I for insert to authenticated with check (hotel_id = (select public.hotel_current_id()))',target);
 end loop;
 foreach target in array array['guests','reservations'] loop
  execute format('drop policy staff_update on public.%I',target);
  execute format('create policy staff_update on public.%I for update to authenticated using (hotel_id = (select public.hotel_current_id())) with check (hotel_id = (select public.hotel_current_id()))',target);
 end loop;
 foreach target in array array['rooms','services'] loop
  execute format('drop policy admin_insert on public.%I',target);
  execute format('drop policy admin_update on public.%I',target);
  execute format('create policy admin_insert on public.%I for insert to authenticated with check (hotel_id = (select hotel_id from public.profiles where id = (select auth.uid()) and role = ''admin''))',target);
  execute format('create policy admin_update on public.%I for update to authenticated using (hotel_id = (select hotel_id from public.profiles where id = (select auth.uid()) and role = ''admin'')) with check (hotel_id = (select hotel_id from public.profiles where id = (select auth.uid()) and role = ''admin''))',target);
 end loop;
end $$;

create function public.hotel_onboard(kind text, display_name text default null, invite_code uuid default null)
returns void language plpgsql security definer set search_path = '' as $$
declare account uuid := auth.uid(); tenant uuid;
begin
 if account is null then raise exception 'Inicia sesión antes de completar tu registro'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(account::text,0));
 if exists(select 1 from public.profiles where id=account) or exists(select 1 from public.customers where id=account)
 then raise exception 'Esta cuenta ya tiene un perfil'; end if;
 case kind
 when 'customer' then
  insert into public.customers(id,full_name) values(account,pg_catalog.btrim(display_name));
 when 'admin' then
  insert into public.hotels(name) values(pg_catalog.btrim(display_name)) returning id into tenant;
  insert into public.profiles(id,role,hotel_id) values(account,'admin',tenant);
 when 'staff' then
  delete from public.staff_invites where code=invite_code and expires_at>pg_catalog.now() returning hotel_id into tenant;
  if tenant is null then raise exception 'El código de invitación no es válido o ya venció'; end if;
  insert into public.profiles(id,role,hotel_id) values(account,'receptionist',tenant);
 else raise exception 'Tipo de registro desconocido';
 end case;
end $$;
create function public.hotel_invite_staff() returns uuid
language plpgsql security definer set search_path = '' as $$
declare tenant uuid; new_code uuid;
begin
 select hotel_id into tenant from public.profiles where id=auth.uid() and role='admin';
 if tenant is null then raise exception 'Solo un administrador puede generar invitaciones'; end if;
 insert into public.staff_invites(hotel_id) values(tenant) returning code into new_code;
 return new_code;
end $$;
revoke all on function public.hotel_onboard(text,text,uuid),public.hotel_invite_staff() from public,anon,authenticated;
grant execute on function public.hotel_onboard(text,text,uuid),public.hotel_invite_staff() to authenticated;
