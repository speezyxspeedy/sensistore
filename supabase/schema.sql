create extension if not exists pgcrypto;
set search_path = public, extensions;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  email text unique not null,
  phone text not null default '',
  -- Browser-generated PBKDF2 hashes are stored here. Plaintext passwords are not stored.
  password text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.users drop constraint if exists users_id_fkey;
alter table public.users alter column id set default gen_random_uuid();
update public.users set email = lower(trim(email));
update public.users set role = 'admin' where email = 'bglspeedy@gmail.com';

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_id text unique not null,
  email text not null,
  -- Retained as a compatibility mirror for older app deployments.
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
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders add column if not exists email text;
update public.orders
set email = lower(trim(user_email))
where email is null or trim(email) = '';
update public.orders
set email = lower(trim(email)), user_email = lower(trim(email));
alter table public.orders alter column email set not null;
alter table public.orders add column if not exists notes text not null default '';

-- Remove the previous custom-session RPC layer if it was installed.
drop function if exists public.register_store_user(text, text, text, text);
drop function if exists public.login_store_user(text, text);
drop function if exists public.restore_store_session(text);
drop function if exists public.logout_store_session(text);
drop function if exists public.list_store_users(text);
drop function if exists public.create_store_order(text, text, text, text, text, text, text, text, text, text, integer, text);
drop function if exists public.list_store_orders(text);
drop function if exists public.list_all_store_orders(text);
drop function if exists public.update_store_order(text, uuid, text, text);
drop function if exists public.assert_store_admin(text);
drop function if exists public.store_session_user(text);
drop function if exists public.issue_store_session(uuid);
drop table if exists public.user_sessions;
drop function if exists public.is_store_admin();

alter table public.users enable row level security;
alter table public.orders enable row level security;

drop policy if exists "users read own or admin" on public.users;
drop policy if exists "users insert own" on public.users;
drop policy if exists "users update own or admin" on public.users;
drop policy if exists "users direct select" on public.users;
drop policy if exists "users direct signup" on public.users;
drop policy if exists "orders read own or admin" on public.orders;
drop policy if exists "orders insert own" on public.orders;
drop policy if exists "orders admin update" on public.orders;
drop policy if exists "orders direct select" on public.orders;
drop policy if exists "orders direct insert" on public.orders;
drop policy if exists "orders direct update" on public.orders;

grant select, insert on table public.users to anon, authenticated;
grant select, insert, update on table public.orders to anon, authenticated;

-- Required by the requested browser-only users-table signup/login flow.
create policy "users direct select" on public.users for select to anon, authenticated
  using (true);
create policy "users direct signup" on public.users for insert to anon, authenticated
  with check (
    role = 'customer'
    and lower(email) <> 'bglspeedy@gmail.com'
    and password like 'pbkdf2$%'
  );

create policy "orders direct select" on public.orders for select to anon, authenticated
  using (true);
create policy "orders direct insert" on public.orders for insert to anon, authenticated
  with check (
    email = lower(trim(email))
    and user_email = email
    and exists (select 1 from public.users u where lower(u.email) = email)
    and ((plan = 'normal' and amount = 199) or (plan = 'premium' and amount = 499))
    and char_length(trim(payment_id)) between 6 and 80
    and payment_status = 'Pending'
    and order_status = 'Pending'
  );
create policy "orders direct update" on public.orders for update to anon, authenticated
  using (true) with check (char_length(notes) <= 2000);

create or replace function public.initialize_store_admin(p_password text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if char_length(coalesce(p_password, '')) < 10 or char_length(p_password) > 128 then
    raise exception 'Admin password must contain 10 to 128 characters.' using errcode = 'P0001';
  end if;
  insert into public.users (name, email, phone, password, role)
  values (
    'Sensi Store Admin',
    'bglspeedy@gmail.com',
    '',
    'sha256:' || encode(digest(p_password, 'sha256'), 'hex'),
    'admin'
  )
  on conflict (email) do update set password = excluded.password, role = 'admin';
end;
$$;

revoke all on function public.initialize_store_admin(text) from public, anon, authenticated;

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
create index if not exists orders_email_idx on public.orders (lower(email));
create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- Run separately in the SQL Editor with your chosen admin password:
-- select public.initialize_store_admin('replace-with-a-strong-admin-password');
-- If an old Auth-created customer row has a null password, delete that one row before signing up again.
notify pgrst, 'reload schema';
