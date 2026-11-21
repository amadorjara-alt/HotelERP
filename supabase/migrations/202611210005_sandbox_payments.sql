create table public.sandbox_payments (
 id uuid primary key default gen_random_uuid(),
 reservation_id uuid not null unique references public.reservations,
 customer_id uuid references public.customers on delete set null,
 provider text not null check (provider in ('stripe','paypal')),
 pen_cents integer not null check (pen_cents>0),
 charged_cents integer not null check (charged_cents>0),
 currency text not null check ((provider='stripe' and currency='PEN') or (provider='paypal' and currency='USD')),
 external_id text,
 checkout_url text,
 status text not null default 'pending' check (status in ('pending','paid')),
 created_at timestamptz not null default now()
);
alter table public.sandbox_payments enable row level security;
revoke all on public.sandbox_payments from public,anon,authenticated;
grant select on public.sandbox_payments to authenticated;
grant select,insert,update on public.sandbox_payments to service_role;
create policy sandbox_payments_read_own on public.sandbox_payments for select to authenticated
using (customer_id=(select auth.uid()));
