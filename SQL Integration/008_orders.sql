-- ============================================================================
-- Sonic Sticker — Migration 008: Orders
-- ============================================================================
-- Adds price_cents to presets and creates the orders table for checkout.
-- Run after 005_pack_schema.sql.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- price_cents on presets (default $12.00; pack stickers default $14.00)
-- ----------------------------------------------------------------------------
alter table public.presets
  add column if not exists price_cents integer not null default 1200;

-- Pack stickers are priced slightly higher
update public.presets set price_cents = 1400 where pack_id is not null;

-- ----------------------------------------------------------------------------
-- orders table
-- ----------------------------------------------------------------------------
create table if not exists public.orders (
  id               uuid primary key default uuid_generate_v4(),
  preset_id        text references public.presets(id) on delete set null,
  user_id          uuid references public.profiles(id) on delete set null,
  customer_name    text not null,
  customer_email   text not null,
  shipping_address text not null,
  quantity         integer not null default 1
                   check (quantity >= 1 and quantity <= 20),
  magnet_size      text not null
                   check (magnet_size in ('2inch', '3inch', '4inch')),
  notes            text,
  unit_price_cents integer not null,
  total_cents      integer not null,
  status           text not null default 'pending_payment'
                   check (status in (
                     'pending_payment', 'paid',
                     'in_production', 'shipped',
                     'delivered', 'cancelled'
                   )),
  created_at       timestamptz not null default now()
);

create index if not exists orders_email_idx  on public.orders (customer_email);
create index if not exists orders_status_idx on public.orders (status, created_at desc);
create index if not exists orders_user_idx   on public.orders (user_id) where user_id is not null;

alter table public.orders enable row level security;

-- Anyone can place an order (anon checkout supported)
create policy "orders: anyone can insert"
  on public.orders for insert
  with check (true);

-- Logged-in users can view orders they placed while signed in
create policy "orders: users can view own"
  on public.orders for select
  using (auth.uid() = user_id);

comment on table public.orders is 'Customer sticker orders. Paid via Venmo, fulfilled manually. Founder reads via dashboard.';
