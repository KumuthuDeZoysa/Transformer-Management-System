import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'

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
  const { data, error } = await supabase.from('images').insert(body).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
