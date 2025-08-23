# Supabase Backend Integration

This app is wired to a Supabase project for storing transformer metadata and image metadata.

## Configure environment

Copy `.env.local.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL=https://xbcgrpqiibicestnhytt.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<your anon key>`

Do not commit secrets.

## Database schema

Run the SQL in `supabase/schema.sql` in the Supabase SQL editor to create tables and RLS policies.

Tables:
- `transformers(id uuid, name text, location text, status text, created_at timestamptz)`
- `images(id uuid, transformer_id uuid -> transformers.id, url text, label text, captured_at timestamptz, created_at timestamptz)`

RLS policies included allow public read and anon insert (for demo). Tighten for production.

## Seed data

After the schema is applied and env vars are set, start the dev server and call:
- POST `/api/seed`

This seeds a few transformers and sample image metadata using local placeholder images available under `/public`.

## API routes

- `GET /api/transformers?limit=50&offset=0`
- `POST /api/transformers` with JSON body `{ name, location, status }`
- `GET /api/images?transformer_id=<uuid>`
- `POST /api/images` with JSON body `{ transformer_id, url, label, captured_at? }`

## Notes

- Image binaries should live in object storage (e.g., Supabase Storage, S3). Store only the URL in `images.url`.
- For admin-only writes, use server-only Service Role key and stricter RLS.
