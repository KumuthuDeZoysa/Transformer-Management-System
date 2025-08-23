import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!url || !anon) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}
const supabase = createClient(url, anon)

async function run() {
  const { data: transformers, error: tErr } = await supabase.from('transformers').select('id, code').limit(20)
  if (tErr) throw tErr
  if (!transformers || transformers.length === 0) {
    console.log('No transformers to seed inspections for.')
    return
  }
  const now = Date.now()
  const items = transformers.flatMap((t, idx) => {
    return [0,1,2].map((k) => ({
      transformer_id: t.id,
      inspection_no: String(123580 + idx * 3 + k).padStart(8, '0'),
      inspected_at: new Date(now - (idx * 3 + k) * 86400000).toISOString(),
      maintenance_date: k % 2 === 0 ? new Date(now - (idx * 3 + k - 1) * 86400000).toISOString() : null,
      status: k === 0 ? 'In Progress' : k === 1 ? 'Pending' : 'Completed',
      notes: null,
    }))
  })
  const { error } = await supabase.from('inspections').insert(items)
  if (error) throw error
  console.log(`Seeded ${items.length} inspections`)
}

run().catch((e) => { console.error(e); process.exit(1) })
