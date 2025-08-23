import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'

const mockTransformers = [
  {
    code: 'AZ-8890', pole_no: 'EN-123-B', region: 'Maharagama', type: 'Distribution', capacity: '100 kVA',
    location: 'Maharagama Junction, Main Road', status: 'Normal', last_inspection: '2023-05-21T12:55:00Z',
    created_at: '2023-01-15T08:00:00Z', updated_at: '2023-05-21T12:55:00Z',
  },
  {
    code: 'AZ-1649', pole_no: 'EN-124-A', region: 'Nugegoda', type: 'Distribution', capacity: '63 kVA',
    location: 'Nugegoda Town Center', status: 'Warning', last_inspection: '2023-05-22T09:30:00Z',
    created_at: '2023-01-20T10:00:00Z', updated_at: '2023-05-22T09:30:00Z',
  },
  {
    code: 'AZ-7316', pole_no: 'EN-125-C', region: 'Colombo', type: 'Power', capacity: '500 kVA',
    location: 'Colombo Fort Railway Station', status: 'Critical', last_inspection: '2023-05-23T14:15:00Z',
    created_at: '2023-02-01T09:00:00Z', updated_at: '2023-05-23T14:15:00Z',
  },
  {
    code: 'AZ-4613', pole_no: 'EN-126-D', region: 'Dehiwala', type: 'Distribution', capacity: '160 kVA',
    location: 'Dehiwala Beach Road', status: 'Normal', last_inspection: '2023-05-24T10:45:00Z',
    created_at: '2023-02-10T11:00:00Z', updated_at: '2023-05-24T10:45:00Z',
  },
  {
    code: 'AX-8993', pole_no: 'EN-127-E', region: 'Mount Lavinia', type: 'Power', capacity: '315 kVA',
    location: 'Mount Lavinia Hotel Area', status: 'Normal', last_inspection: '2023-05-25T15:20:00Z',
    created_at: '2023-02-15T12:00:00Z', updated_at: '2023-05-25T15:20:00Z',
  },
  {
    code: 'AY-8790', pole_no: 'EN-128-F', region: 'Ratmalana', type: 'Distribution', capacity: '100 kVA',
    location: 'Ratmalana Airport Road', status: 'Warning', last_inspection: '2023-05-26T11:15:00Z',
    created_at: '2023-02-20T13:00:00Z', updated_at: '2023-05-26T11:15:00Z',
  },
]

export async function POST(_req: NextRequest) {
  const supabase = createServerClient()

  // Try a lightweight select to detect missing table
  const sel = await supabase.from('transformers').select('id').limit(1)
  if (sel.error) {
    return NextResponse.json(
      { error: 'Table transformers missing. Open Supabase → SQL Editor and run supabase/schema.sql, then retry.' },
      { status: 400 },
    )
  }

  const { error } = await supabase.from('transformers').upsert(mockTransformers, { onConflict: 'code' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, transformers: mockTransformers.length })
}
