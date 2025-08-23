import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

// GET /api/inspections?transformer_id=uuid&limit=50&offset=0
export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const limit = Number(searchParams.get('limit') ?? '50')
  const offset = Number(searchParams.get('offset') ?? '0')
  const transformerId = searchParams.get('transformer_id')

  let query = supabase
    .from('inspections')
    .select('*')
    .order('inspected_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (transformerId) {
    query = query.eq('transformer_id', transformerId)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/inspections
export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const body = await req.json()
  const toInsert = {
    transformer_id: body.transformer_id,
    inspection_no: body.inspection_no ?? null,
    inspected_at: body.inspected_at ?? new Date().toISOString(),
    maintenance_date: body.maintenance_date ?? null,
    status: body.status ?? 'Completed',
    notes: body.notes ?? null,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('inspections').insert(toInsert).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
