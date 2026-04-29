-- Run this in Supabase SQL Editor: https://supabase.com → SQL Editor → New Query

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Invoices table
create table if not exists invoices (
  id uuid primary key default uuid_generate_v4(),
  invoice_number text not null unique,          -- e.g. INV-AB12CD
  status text not null default 'unpaid',        -- unpaid | paid | cancelled

  -- Sender
  your_name text not null,
  your_email text,
  your_wallet text not null,

  -- Client
  client_name text not null,
  client_email text not null,
  client_wallet text,

  -- Payment
  currency text not null default 'USDC',        -- ETH | USDC | BTC | USDT
  total numeric(18, 6) not null,
  due_date date,
  note text,

  -- Line items stored as JSON
  items jsonb not null default '[]',

  -- Stripe fallback
  stripe_session_id text,
  stripe_paid boolean default false,

  -- Timestamps
  created_at timestamptz default now(),
  paid_at timestamptz
);

-- Allow public read for the payment page (no auth needed to view/pay)
alter table invoices enable row level security;

create policy "Anyone can view invoices by number"
  on invoices for select
  using (true);

create policy "Anyone can create invoices"
  on invoices for insert
  with check (true);

create policy "Anyone can update invoice status"
  on invoices for update
  using (true);
