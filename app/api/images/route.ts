import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

// GET /api/images?transformer_id=... -> list images (optionally by transformer)
export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const transformerId = searchParams.get('transformer_id')

  let query = supabase.from('images').select('*').order('captured_at', { ascending: false })
  if (transformerId) {
    query = query.eq('transformer_id', transformerId)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}

// POST /api/images -> create image metadata (expects URL, transformer_id, etc.)
export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const body = await req.json()
  // Accept broader shape but only persist known columns
  const payload = {
    transformer_id: body.transformer_id,
    url: body.url,
    label: body.label ?? null,
    captured_at: body.captured_at ?? new Date().toISOString(),
  }
  const { data, error } = await supabase
    .from('images')
    .insert(payload)
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
