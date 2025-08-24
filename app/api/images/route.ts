import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

// GET /api/images?transformer_id=... -> list images (optionally by transformer)
export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const transformerId = searchParams.get('transformer_id')
  const inspectionId = searchParams.get('inspection_id')

  let query = supabase.from('images').select('*').order('captured_at', { ascending: false })
  
  // For now, filter by transformer_id only since inspection_id column might not exist
  // TODO: Add inspection_id column to database schema
  if (transformerId) {
    query = query.eq('transformer_id', transformerId)
  } else if (inspectionId) {
    // If filtering by inspection_id, we need to get transformer_id first
    // For now, return empty array to avoid database errors
    return NextResponse.json({ items: [] })
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  
  // If inspection_id was requested, filter by label containing inspection_id
  let filteredData = data ?? []
  if (inspectionId && filteredData.length > 0) {
    filteredData = filteredData.filter(img => 
      img.label && img.label.includes(inspectionId)
    )
  }
  
  return NextResponse.json({ items: filteredData })
}

// POST /api/images -> create image metadata (expects URL, transformer_id, etc.)
export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const body = await req.json()
  // Use existing schema fields only for now
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
