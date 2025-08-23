import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!url || !anon) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
  process.exit(1)
}
const supabase = createClient(url, anon)

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

async function main() {
  // Check if table exists
  const { error: selErr } = await supabase.from('transformers').select('id').limit(1)
  if (selErr) {
    console.error('Table transformers missing. Run supabase/schema.sql in SQL Editor before seeding.')
    process.exit(1)
  }

  // Upsert by code to avoid duplicates on re-runs
  const { error } = await supabase.from('transformers').upsert(mockTransformers, { onConflict: 'code' })
  if (error) {
    console.error('Insert failed:', error.message)
    process.exit(1)
  }
  console.log(`Inserted/updated ${mockTransformers.length} transformers`)
}

main().catch((e) => { console.error(e); process.exit(1) })
