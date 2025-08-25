import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'

// GET /api/transformers -> list transformers with optional pagination
export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const limit = Number(searchParams.get('limit') ?? '50')
  const offset = Number(searchParams.get('offset') ?? '0')
  const q = searchParams.get('q')?.trim()

  let query = supabase.from('transformers').select('*')
  if (q && q.length > 0) {
    // Search by business code; could be extended to region/location if needed
    query = query.ilike('code', `%${q}%`)
  }
  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/transformers -> create transformer
export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const body = await req.json()
  const toInsert = {
    code: body.code ?? body.id ?? null,
    pole_no: body.pole_no ?? body.poleNo ?? null,
    region: body.region ?? null,
    type: body.type ?? null,
    capacity: body.capacity ?? null,
    location: body.location ?? null,
    status: (body.status ?? 'Normal'),
    last_inspection: body.lastInspection ?? null,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('transformers').insert(toInsert).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
