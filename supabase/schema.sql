-- SQL schema for Supabase PostgreSQL
-- Ensure extension for UUID generation
create extension if not exists pgcrypto;

-- Create tables
create table if not exists public.transformers (
  id uuid primary key default gen_random_uuid(),
  -- business identifier from UI (e.g., AZ-8890)
  code text unique,
  pole_no text,
  region text,
  type text check (type in ('Distribution','Power','Bulk')),
  capacity text,
  location text,
  status text check (status in ('Normal','Warning','Critical')) default 'Normal',
  last_inspection timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists idx_transformers_code on public.transformers(code);
create index if not exists idx_transformers_region on public.transformers(region);

create table if not exists public.images (
  id uuid primary key default gen_random_uuid(),
  transformer_id uuid not null references public.transformers(id) on delete cascade,
  url text not null,
  label text,
  captured_at timestamptz default now(),
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.transformers enable row level security;
alter table public.images enable row level security;

-- Basic public read policies (adjust as needed)
drop policy if exists "Public read transformers" on public.transformers;
create policy "Public read transformers" on public.transformers for select using (true);
drop policy if exists "Public read images" on public.images;
create policy "Public read images" on public.images for select using (true);

-- Insert permissions for anon (optional for seeding/demo). Consider restricting in production.
drop policy if exists "Anon insert transformers" on public.transformers;
create policy "Anon insert transformers" on public.transformers for insert with check (true);
drop policy if exists "Anon update transformers" on public.transformers;
create policy "Anon update transformers" on public.transformers for update using (true) with check (true);
drop policy if exists "Anon delete transformers" on public.transformers;
create policy "Anon delete transformers" on public.transformers for delete using (true);
drop policy if exists "Anon insert images" on public.images;
create policy "Anon insert images" on public.images for insert with check (true);
drop policy if exists "Anon update images" on public.images;
create policy "Anon update images" on public.images for update using (true) with check (true);
drop policy if exists "Anon delete images" on public.images;
create policy "Anon delete images" on public.images for delete using (true);
