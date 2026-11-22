-- Ejecutar en SQL Editor después de aplicar las migraciones de HotelERP.
-- Usa un hotel con administrador: primero «Rodolfo», luego «Hotel Demo ERP».
-- Para elegir otro hotel de pruebas, indica su UUID en hotel_objetivo.
-- Habilita el catálogo público del hotel seleccionado.
-- Al volver a ejecutar, conserva las fechas, estados y consumos existentes.

begin;

do $seed$
declare
  hotel_objetivo uuid := null;
  hoteles_candidatos uuid[];
  hoy date := (now() at time zone 'America/Lima')::date;
  prefijo text;
  habitacion_demo record;
  servicio_demo record;
  i integer;
  inicio integer[] := array[-1, 1, 2, 4, 5];
  salida integer[] := array[1, 3, 5, 6, 7];
  huesped integer[] := array[1, 2, 3, 4, 1];
  tarifas numeric[] := array[120, 180, 210, 280, 390];
  precios numeric[] := array[35, 25, 20, 60];
  cargos record;
  cargo_id uuid;
  reserva_id uuid;
begin
  if hotel_objetivo is null then
    select h.ids into hoteles_candidatos
    from (
      select hotel.name, array_agg(hotel.id order by hotel.id) as ids
      from public.hotels hotel
      where hotel.name in ('Rodolfo', 'Hotel Demo ERP')
        and exists (select 1 from public.profiles p
                    where p.hotel_id = hotel.id and p.role = 'admin')
      group by hotel.name
    ) h
    order by case when h.name = 'Rodolfo' then 0 else 1 end
    limit 1;
    if coalesce(cardinality(hoteles_candidatos), 0) <> 1 then
      raise exception 'Selecciona un hotel de pruebas con administrador en hotel_objetivo o verifica que Rodolfo o Hotel Demo ERP no esté duplicado.';
    end if;
    hotel_objetivo := hoteles_candidatos[1];
  end if;

  if not exists (select 1 from public.profiles
                 where hotel_id = hotel_objetivo and role = 'admin') then
    raise exception 'El hotel de prueba seleccionado no tiene un administrador.';
  end if;

  prefijo := hotel_objetivo::text || ':HotelERP:demo:v1:';
  perform pg_advisory_xact_lock(hashtextextended(prefijo, 0));

  update public.hotels
  set accepts_online_booking = true
  where id = hotel_objetivo and not accepts_online_booking;

  for habitacion_demo in
    select * from (values (1, 'Simple', 1), (2, 'Doble', 2), (3, 'Matrimonial', 2),
                          (4, 'Familiar', 4), (5, 'Suite', 2)) as t(n, nombre, capacidad)
  loop
    i := habitacion_demo.n;
    insert into public.rooms as room (id, hotel_id, number, name, nightly_rate, capacity)
    values (md5(prefijo || 'room:' || i)::uuid, hotel_objetivo,
            'DEMO-' || (100 + i), habitacion_demo.nombre, tarifas[i], habitacion_demo.capacidad)
    on conflict (id) do update
    set capacity = excluded.capacity
    where room.hotel_id = excluded.hotel_id and room.capacity is distinct from excluded.capacity;
  end loop;

  for servicio_demo in
    select * from (values (1, 'Demo Desayuno'), (2, 'Demo Lavandería'),
                          (3, 'Demo Estacionamiento'), (4, 'Demo Traslado')) as t(n, nombre)
  loop
    i := servicio_demo.n;
    insert into public.services (id, hotel_id, name, price)
    values (md5(prefijo || 'service:' || i)::uuid, hotel_objetivo,
            servicio_demo.nombre, precios[i])
    on conflict (id) do nothing;
  end loop;

  for i in 1..4 loop
    insert into public.guests (id, hotel_id, full_name, document_number, email)
    values (md5(prefijo || 'guest:' || i)::uuid, hotel_objetivo,
            (array['Andrea Demo', 'Bruno Demo', 'Carla Demo', 'Diego Demo'])[i],
            'HOTELERP-DEMO-' || i, 'huesped' || i || '@example.test')
    on conflict (id) do nothing;
  end loop;

  for i in 1..5 loop
    if exists (select 1 from public.reservations
               where id = md5(prefijo || 'reservation:' || i)::uuid) then
      continue;
    end if;
    insert into public.reservations
      (id, hotel_id, room_id, guest_id, check_in, check_out, status, nightly_rate)
    values (md5(prefijo || 'reservation:' || i)::uuid, hotel_objetivo,
            md5(prefijo || 'room:' || i)::uuid, md5(prefijo || 'guest:' || huesped[i])::uuid,
            hoy + inicio[i], hoy + salida[i],
            case when i = 1 then 'occupied' else 'reserved' end, tarifas[i]);
  end loop;

  for cargos in
    select * from (values (1,1,1,2), (2,1,2,1), (3,2,3,1), (4,3,4,1))
      as t(n, reserva, servicio, cantidad)
  loop
    cargo_id := md5(prefijo || 'charge:' || cargos.n)::uuid;
    reserva_id := md5(prefijo || 'reservation:' || cargos.reserva)::uuid;
    -- Los triggers BEFORE INSERT se ejecutan antes de ON CONFLICT.
    if exists (select 1 from public.reservation_services where id = cargo_id) then
      continue;
    end if;

    -- Omite consumos faltantes si la estadía ya se cerró o se canceló.
    perform 1 from public.reservations
    where id = reserva_id and hotel_id = hotel_objetivo
      and status in ('reserved', 'occupied')
    for share;
    if not found then
      continue;
    end if;

    insert into public.reservation_services
      (id, hotel_id, reservation_id, service_id, quantity, unit_price)
    values (cargo_id, hotel_objetivo, reserva_id,
            md5(prefijo || 'service:' || cargos.servicio)::uuid,
            cargos.cantidad, precios[cargos.servicio])
    on conflict (id) do nothing;
  end loop;

  raise notice 'Datos de demostración disponibles para el hotel %.', hotel_objetivo;
end;
$seed$;

commit;
