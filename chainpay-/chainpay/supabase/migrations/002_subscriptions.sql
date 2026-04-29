-- ============================================================
-- MIGRATION 002: Users, Subscriptions & Invoice Limits
-- Run this in Supabase SQL Editor AFTER migration 001
-- ============================================================

-- User profiles (linked to Supabase auth)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz default now()
);

-- Subscriptions table
create table if not exists subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  plan text not null default 'free',          -- free | pro | business
  status text not null default 'active',      -- active | cancelled | past_due
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Link invoices to users
alter table invoices add column if not exists user_id uuid references profiles(id);

-- ── Row Level Security ──────────────────────────────────────

alter table profiles enable row level security;
alter table subscriptions enable row level security;

-- Profiles: users can only see/edit their own
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- Subscriptions: users can only see their own
create policy "Users can view own subscription"
  on subscriptions for select using (auth.uid() = user_id);

-- Invoices: users can only see their own
drop policy if exists "Anyone can view invoices by number" on invoices;
drop policy if exists "Anyone can create invoices" on invoices;
drop policy if exists "Anyone can update invoice status" on invoices;

create policy "Users can view own invoices"
  on invoices for select
  using (auth.uid() = user_id or user_id is null);

create policy "Users can create invoices"
  on invoices for insert
  with check (auth.uid() = user_id);

create policy "Users can update own invoices"
  on invoices for update
  using (auth.uid() = user_id or user_id is null);

-- Public read for payment page (by invoice number — no auth)
create policy "Public can view invoice by number for payment"
  on invoices for select
  using (true);

-- ── Auto-create profile on signup ──────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );

  -- Auto-assign free plan
  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active');

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
