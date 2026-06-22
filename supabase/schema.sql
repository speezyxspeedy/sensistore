create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text unique not null,
  phone text not null default '',
  -- Passwords are verified by Supabase Auth and are never stored here.
  -- This nullable column remains only to match the requested table shape.
  password text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_id text unique not null,
  user_email text not null,
  customer_name text not null,
  phone text not null,
  device_name text not null,
  device_model text not null,
  ram text not null,
  android_version text not null,
  game_name text not null,
  plan text not null check (plan in ('normal', 'premium')),
  amount integer not null check (amount > 0),
  payment_id text not null,
  payment_status text not null default 'Pending' check (payment_status in ('Pending', 'Paid', 'Failed')),
  order_status text not null default 'Pending' check (order_status in ('Pending', 'Processing', 'Delivered')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.orders enable row level security;

create or replace function public.is_store_admin()
returns boolean language sql stable as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'bglspeedy@gmail.com';
$$;

drop policy if exists "users read own or admin" on public.users;
drop policy if exists "users insert own" on public.users;
drop policy if exists "users update own or admin" on public.users;
drop policy if exists "orders read own or admin" on public.orders;
drop policy if exists "orders insert own" on public.orders;
drop policy if exists "orders admin update" on public.orders;

create policy "users read own or admin" on public.users for select
  using (id = auth.uid() or public.is_store_admin());
create policy "users insert own" on public.users for insert
  with check (
    id = auth.uid()
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and password is null
    and (role = 'customer' or public.is_store_admin())
  );
create policy "users update own or admin" on public.users for update
  using (id = auth.uid() or public.is_store_admin())
  with check (
    public.is_store_admin()
    or (
      id = auth.uid()
      and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and role = 'customer'
      and password is null
    )
  );

create policy "orders read own or admin" on public.orders for select
  using (lower(user_email) = lower(coalesce(auth.jwt() ->> 'email', '')) or public.is_store_admin());
create policy "orders insert own" on public.orders for insert
  with check (
    lower(user_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and (
      (plan = 'normal' and amount = 199)
      or (plan = 'premium' and amount = 499)
    )
    and char_length(trim(payment_id)) between 6 and 80
    and payment_status = 'Pending'
    and order_status = 'Pending'
  );
create policy "orders admin update" on public.orders for update
  using (public.is_store_admin()) with check (public.is_store_admin());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, name, email, phone, password, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    null,
    case when lower(new.email) = 'bglspeedy@gmail.com' then 'admin' else 'customer' end
  ) on conflict (id) do update set
    name = excluded.name,
    email = excluded.email,
    phone = excluded.phone;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert or update on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.set_order_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at before update on public.orders
for each row execute procedure public.set_order_updated_at();

create index if not exists orders_user_email_idx on public.orders (lower(user_email));
create index if not exists orders_created_at_idx on public.orders (created_at desc);
