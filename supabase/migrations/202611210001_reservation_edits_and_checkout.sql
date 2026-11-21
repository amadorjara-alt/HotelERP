create function public.hotel_validate_reservation_update() returns trigger
language plpgsql set search_path = '' as $$
begin
 if (new.room_id,new.guest_id,new.check_in,new.check_out) is distinct from (old.room_id,old.guest_id,old.check_in,old.check_out) then
  if old.status <> 'reserved' or new.status <> 'reserved' then
   raise exception 'Solo se pueden editar los datos de una reserva pendiente' using errcode = '23514';
  end if;
  if new.room_id <> old.room_id then
   select nightly_rate into new.nightly_rate
   from public.rooms where hotel_id = new.hotel_id and id = new.room_id;
  end if;
 end if;
 if new.status <> old.status and not (
  (old.status = 'reserved' and new.status in ('occupied','cancelled')) or
  (old.status = 'occupied' and new.status = 'completed')
 ) then
  raise exception 'Cambio de estado no permitido' using errcode = '23514';
 end if;
 return new;
end;
$$;
revoke execute on function public.hotel_validate_reservation_update() from public,anon,authenticated;
create trigger hotel_validate_reservation_update before update on public.reservations
for each row execute function public.hotel_validate_reservation_update();
grant update (room_id,guest_id,check_in,check_out) on public.reservations to authenticated;

create function public.hotel_validate_service_stay() returns trigger
language plpgsql set search_path = '' as $$
declare stay_status text;
begin
 select status into stay_status from public.reservations
 where id = new.reservation_id and hotel_id = new.hotel_id for share;
 if stay_status is null or stay_status not in ('reserved','occupied') then
  raise exception 'Solo se pueden agregar consumos a una reserva abierta' using errcode = '23514';
 end if;
 return new;
end;
$$;
revoke execute on function public.hotel_validate_service_stay() from public,anon,authenticated;
create trigger hotel_validate_service_stay before insert on public.reservation_services
for each row execute function public.hotel_validate_service_stay();
