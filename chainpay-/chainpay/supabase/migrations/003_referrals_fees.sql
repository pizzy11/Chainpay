-- ============================================================
-- MIGRATION 003: Referrals & Transaction Fees
-- Run in Supabase SQL Editor AFTER migrations 001 and 002
-- ============================================================

-- ── Referrals table ─────────────────────────────────────────
create table if not exists referrals (
  id uuid primary key default uuid_generate_v4(),
  referrer_id uuid references profiles(id) on delete cascade not null,  -- who shared the link
  referred_id uuid references profiles(id) on delete cascade,           -- who signed up
  referral_code text unique not null,                                   -- e.g. "ALEX20"
  status text not null default 'pending',  -- pending | converted | paid
  reward_amount numeric(10,2) default 0,   -- $ reward earned
  created_at timestamptz default now(),
  converted_at timestamptz
);

-- ── Earnings table (referral commissions + fee revenue) ─────
create table if not exists earnings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  type text not null,               -- 'referral_commission' | 'platform_fee'
  amount numeric(10,4) not null,    -- in USD
  invoice_id uuid references invoices(id),
  referral_id uuid references referrals(id),
  description text,
  created_at timestamptz default now()
);

-- ── Transaction fees on invoices ────────────────────────────
alter table invoices add column if not exists fee_rate numeric(5,4) default 0.005;  -- 0.5%
alter table invoices add column if not exists fee_amount numeric(18,6) default 0;   -- computed fee
alter table invoices add column if not exists fee_collected boolean default false;

-- ── Add referral code to profiles ───────────────────────────
alter table profiles add column if not exists referral_code text unique;
alter table profiles add column if not exists referred_by uuid references profiles(id);
alter table profiles add column if not exists total_earnings numeric(10,2) default 0;
alter table profiles add column if not exists pending_earnings numeric(10,2) default 0;

-- ── RLS Policies ────────────────────────────────────────────
alter table referrals enable row level security;
alter table earnings enable row level security;

create policy "Users can view own referrals"
  on referrals for select using (auth.uid() = referrer_id);

create policy "Users can create referrals"
  on referrals for insert with check (auth.uid() = referrer_id);

create policy "Users can view own earnings"
  on earnings for select using (auth.uid() = user_id);

-- ── Auto-generate referral code on signup ───────────────────
create or replace function generate_referral_code(user_id uuid, user_email text)
returns text as $$
declare
  code text;
  base text;
begin
  -- Use first 4 chars of email + 4 random chars
  base := upper(substring(split_part(user_email, '@', 1) from 1 for 4));
  code := base || upper(substring(md5(user_id::text) from 1 for 4));
  return code;
end;
$$ language plpgsql;

-- Update handle_new_user to also generate referral code
create or replace function public.handle_new_user()
returns trigger as $$
declare
  ref_code text;
begin
  ref_code := generate_referral_code(new.id, new.email);

  insert into public.profiles (id, email, full_name, referral_code)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    ref_code
  );

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active');

  -- Create referral record so the code is trackable
  insert into public.referrals (referrer_id, referral_code)
  values (new.id, ref_code);

  return new;
end;
$$ language plpgsql security definer;

-- ── Function: process referral when a referred user subscribes ─
create or replace function process_referral_conversion(
  referred_user_id uuid,
  ref_code text
)
returns void as $$
declare
  referrer_id uuid;
  reward numeric := 3.80; -- 20% of $19 Pro plan = $3.80/month
begin
  -- Find referrer
  select r.referrer_id into referrer_id
  from referrals r
  where r.referral_code = ref_code and r.status = 'pending';

  if referrer_id is null then return; end if;

  -- Update referral record
  update referrals
  set status = 'converted', referred_id = referred_user_id,
      reward_amount = reward, converted_at = now()
  where referral_code = ref_code;

  -- Update referred user's profile
  update profiles set referred_by = referrer_id where id = referred_user_id;

  -- Log the earning for the referrer
  insert into earnings (user_id, type, referral_id, amount, description)
  select referrer_id, 'referral_commission', r.id, reward,
         'Referral commission — new Pro subscriber'
  from referrals r where r.referral_code = ref_code;

  -- Add to referrer's pending balance
  update profiles set pending_earnings = pending_earnings + reward
  where id = referrer_id;
end;
$$ language plpgsql security definer;

-- ── View: dashboard earnings summary ────────────────────────
create or replace view earnings_summary as
select
  user_id,
  sum(amount) filter (where type = 'referral_commission') as referral_earnings,
  sum(amount) filter (where type = 'platform_fee') as fee_earnings,
  sum(amount) as total_earnings,
  count(*) filter (where type = 'referral_commission') as total_referrals
from earnings
group by user_id;
