alter table public.rooms add column capacity smallint not null default 2 check (capacity between 1 and 20);
update public.rooms set capacity=1 where hotel_id='7bb22036-f725-489d-ac29-130c5872cc32' and number='101';
create table public.customer_guest_links (
 customer_id uuid not null references public.customers on delete cascade,
 hotel_id uuid not null references public.hotels,
 guest_id uuid not null,
 primary key(customer_id,hotel_id),
 foreign key(hotel_id,guest_id) references public.guests(hotel_id,id),
 unique(guest_id)
);
alter table public.customer_guest_links enable row level security;
revoke all on public.customer_guest_links from public,anon,authenticated;

create function public.hotel_public_catalog(arrival date default null, departure date default null)
returns table(id uuid, number text, name text, capacity smallint, nightly_rate numeric, available boolean)
language sql stable security definer set search_path = '' as $$
 select r.id,r.number,r.name,r.capacity,r.nightly_rate,
 case when arrival is null or departure is null then null
      when arrival >= departure or not isfinite(arrival) or not isfinite(departure) then false
      else not exists(
       select 1 from public.reservations b where b.room_id=r.id and b.status<>'cancelled'
       and b.check_in<departure and arrival<b.check_out
      ) end
 from public.rooms r where r.hotel_id='7bb22036-f725-489d-ac29-130c5872cc32'
 order by r.number;
$$;
create function public.hotel_customer_book(room uuid, arrival date, departure date, guest_name text, document text, guest_email text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
 account uuid := auth.uid();
 tenant uuid := '7bb22036-f725-489d-ac29-130c5872cc32';
 guest uuid;
 booking uuid;
 normalized_document text := upper(btrim(document));
begin
 if not exists(select 1 from public.customers where id=account) then raise exception 'Se necesita una cuenta de cliente'; end if;
 if arrival is null or departure is null or not isfinite(arrival) or not isfinite(departure)
 or arrival < (now() at time zone 'America/Lima')::date or departure <= arrival or departure-arrival > 90 then
  raise exception 'La estadía debe comenzar hoy o después y durar de 1 a 90 noches' using errcode='22023';
 end if;
 if not exists(select 1 from public.rooms where id=room and hotel_id=tenant) then raise exception 'Habitación no disponible'; end if;
 if char_length(btrim(guest_name)) not between 2 and 120
 or normalized_document !~ '^[A-Z0-9]{5,20}$'
 or (guest_email is not null and (char_length(guest_email)>120 or guest_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$')) then
  raise exception 'Revisa el nombre, el documento y el correo' using errcode='22023';
 end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(account::text,17));
 select guest_id into guest from public.customer_guest_links where customer_id=account and hotel_id=tenant;
 if guest is null then
  begin
   insert into public.guests(hotel_id,full_name,document_number,email)
    values(tenant,btrim(guest_name),normalized_document,guest_email) returning id into guest;
  exception when unique_violation then
   raise exception 'Esos datos requieren verificación en recepción';
  end;
  insert into public.customer_guest_links values(account,tenant,guest);
 else
  if not exists(select 1 from public.guests where id=guest and document_number=normalized_document) then
   raise exception 'Usa el documento de tu primera reserva o verifica tus datos en recepción';
  end if;
  update public.guests set full_name=btrim(guest_name),email=guest_email where id=guest;
 end if;
 insert into public.reservations(hotel_id,room_id,guest_id,check_in,check_out)
 values(tenant,room,guest,arrival,departure) returning id into booking;
 return booking;
end;
$$;
create function public.hotel_customer_stays()
returns table(id uuid, room text, check_in date, check_out date, status text, nights integer, nightly_rate numeric, lodging_total numeric, services_total numeric, total numeric)
language sql stable security definer set search_path = '' as $$
 select r.id,room.number,r.check_in,r.check_out,r.status,t.nights,t.nightly_rate,t.lodging_total,t.services_total,t.total
 from public.customer_guest_links link join public.reservations r on r.guest_id=link.guest_id and r.hotel_id=link.hotel_id
 join public.rooms room on room.id=r.room_id
 left join public.reservation_totals t on t.reservation_id=r.id
 where link.customer_id=(select auth.uid())
 order by r.check_in desc;
$$;
revoke all on function public.hotel_public_catalog(date,date),public.hotel_customer_book(uuid,date,date,text,text,text),public.hotel_customer_stays() from public,anon,authenticated;
grant execute on function public.hotel_public_catalog(date,date) to anon,authenticated;
grant execute on function public.hotel_customer_book(uuid,date,date,text,text,text),public.hotel_customer_stays() to authenticated;
