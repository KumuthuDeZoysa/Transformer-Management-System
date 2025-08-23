import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!url || !anon) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in env')
  process.exit(1)
}
const supabase = createClient(url, anon)

async function ensureSchema() {
  const sql = `
    create extension if not exists pgcrypto;
    create table if not exists public.transformers (
      id uuid primary key default gen_random_uuid(),
      name text not null,
      location text,
      status text check (status in ('normal','warning','critical')) default 'normal',
      created_at timestamptz not null default now()
    );
    create table if not exists public.images (
      id uuid primary key default gen_random_uuid(),
      transformer_id uuid not null references public.transformers(id) on delete cascade,
      url text not null,
      label text,
      captured_at timestamptz default now(),
      created_at timestamptz not null default now()
    );
    alter table public.transformers enable row level security;
    alter table public.images enable row level security;
    drop policy if exists "Public read transformers" on public.transformers;
    create policy "Public read transformers" on public.transformers for select using (true);
    drop policy if exists "Public read images" on public.images;
    create policy "Public read images" on public.images for select using (true);
    drop policy if exists "Anon insert transformers" on public.transformers;
    create policy "Anon insert transformers" on public.transformers for insert with check (true);
    drop policy if exists "Anon insert images" on public.images;
    create policy "Anon insert images" on public.images for insert with check (true);
  `
  const { error } = await supabase.rpc('exec_sql', { sql })
  if (error) {
    // fallback: try single statements sequentially via rest's /sql isn't available; use admin sql UI instead
    console.warn('Could not run schema via RPC; please paste supabase/schema.sql into SQL Editor. Continuing seed...')
  }
}

async function seed() {
  // try a simple select to see if table exists
  const { error: selectErr } = await supabase.from('transformers').select('id').limit(1)
  if (selectErr && (selectErr.code === '42P01' || selectErr.message?.includes('relation'))) {
    console.log('Tables missing. Please run supabase/schema.sql in the Supabase SQL editor, then re-run `npm run seed`.')
    process.exit(1)
  }

  const transformers = [
    { name: 'TX-100', location: 'Substation A', status: 'normal' },
    { name: 'TX-200', location: 'Substation B', status: 'warning' },
    { name: 'TX-300', location: 'Substation C', status: 'critical' },
  ]

  const { data: tData, error: tErr } = await supabase.from('transformers').insert(transformers).select('id')
  if (tErr) throw tErr
  const [t1, t2, t3] = tData

  const images = [
    { transformer_id: t1.id, url: '/thermal-image-transformer.png', label: 'baseline normal', captured_at: new Date().toISOString() },
    { transformer_id: t2.id, url: '/thermal-transformer-hot.png', label: 'hotspot', captured_at: new Date().toISOString() },
    { transformer_id: t3.id, url: '/thermal-transformer-critical.png', label: 'critical hotspot', captured_at: new Date().toISOString() },
  ]

  const { error: iErr } = await supabase.from('images').insert(images)
  if (iErr) throw iErr

  console.log('Seed complete:', { transformers: tData.length, images: images.length })
}

seed().catch((e) => {
  console.error('Seed failed:', e)
  process.exit(1)
})
