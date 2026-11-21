create table public.account_details (
 id uuid primary key references auth.users on delete cascade,
 full_name text not null check (char_length(btrim(full_name)) between 2 and 120),
 age smallint not null check (age between 18 and 120),
 gender text not null check (gender in ('hombre','mujer','prefiero_no_decirlo')),
 dni text not null check (dni ~ '^[0-9]{8}$')
);
alter table public.account_details enable row level security;
revoke all on public.account_details from public,anon,authenticated;
grant select on public.account_details to authenticated;
create policy account_details_read_own on public.account_details for select to authenticated
using (id=(select auth.uid()));

create function public.hotel_finish_registration(kind text, full_name text, age smallint, gender text, dni text, hotel_name text default null, invite_code uuid default null)
returns void language plpgsql security definer set search_path = '' as $$
declare account uuid := auth.uid();
begin
 if account is null then raise exception 'Inicia sesión para completar tus datos'; end if;
 insert into public.account_details(id,full_name,age,gender,dni)
 values(account,pg_catalog.btrim(full_name),age,gender,pg_catalog.btrim(dni));
 perform public.hotel_onboard(kind,case when kind='admin' then hotel_name else full_name end,invite_code);
end;
$$;
revoke all on function public.hotel_finish_registration(text,text,smallint,text,text,text,uuid) from public,anon,authenticated;
grant execute on function public.hotel_finish_registration(text,text,smallint,text,text,text,uuid) to authenticated;
