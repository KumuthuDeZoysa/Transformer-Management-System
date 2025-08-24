// Enhanced seed script for adding more inspection dummy data
import { createClient } from '@supabase/supabase-js'

// You can get these from your .env.local file
const SUPABASE_URL = 'https://rwomthwldsdjqvjhpzfg.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3b210aHdsZHNkanF2amhwemZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NTE1MDcsImV4cCI6MjA1MDUyNzUwN30.3Fy0ysAjJM0xjowJCgMr34Zg1kGWMTLkCgLPKR5Lg1A'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function seedInspections() {
  try {
    console.log('Starting to seed inspection data...')
    
    // Get existing transformers
    const { data: transformers, error: tErr } = await supabase
      .from('transformers')
      .select('id, code, region')
      .limit(10)
    
    if (tErr) throw tErr
    if (!transformers || transformers.length === 0) {
      console.log('No transformers found to seed inspections for.')
      return
    }

    const now = new Date()
    const oneDay = 24 * 60 * 60 * 1000
    const inspections = []

    // Create a variety of inspections with different statuses and maintenance dates
    transformers.forEach((transformer, idx) => {
      // Completed inspections (with maintenance dates)
      inspections.push({
        transformer_id: transformer.id,
        inspection_no: `0013232${350 + idx * 5}`,
        inspected_at: new Date(now.getTime() - (idx * 5 + 30) * oneDay).toISOString(),
        maintenance_date: new Date(now.getTime() - (idx * 5 + 25) * oneDay).toISOString(),
        status: 'Completed',
        notes: `Completed thermal inspection for ${transformer.code}. Minor hotspot detected and resolved.`
      })

      // Another completed inspection
      inspections.push({
        transformer_id: transformer.id,
        inspection_no: `0013232${351 + idx * 5}`,
        inspected_at: new Date(now.getTime() - (idx * 5 + 15) * oneDay).toISOString(),
        maintenance_date: new Date(now.getTime() - (idx * 5 + 10) * oneDay).toISOString(),
        status: 'Completed',
        notes: `Routine maintenance completed for ${transformer.code}. All systems normal.`
      })

      // In Progress inspection (no maintenance date yet)
      inspections.push({
        transformer_id: transformer.id,
        inspection_no: `0013232${352 + idx * 5}`,
        inspected_at: new Date(now.getTime() - (idx * 5 + 7) * oneDay).toISOString(),
        maintenance_date: null,
        status: 'In Progress',
        notes: `Ongoing thermal inspection for ${transformer.code}. Awaiting final analysis.`
      })

      // Pending inspection
      inspections.push({
        transformer_id: transformer.id,
        inspection_no: `0013232${353 + idx * 5}`,
        inspected_at: new Date(now.getTime() - (idx * 5 + 2) * oneDay).toISOString(),
        maintenance_date: null,
        status: 'Pending',
        notes: `Scheduled inspection for ${transformer.code}.`
      })

      // Another completed with recent maintenance
      inspections.push({
        transformer_id: transformer.id,
        inspection_no: `0013232${354 + idx * 5}`,
        inspected_at: new Date(now.getTime() - (idx * 5 + 45) * oneDay).toISOString(),
        maintenance_date: new Date(now.getTime() - (idx * 5 + 40) * oneDay).toISOString(),
        status: 'Completed',
        notes: `Emergency inspection and maintenance for ${transformer.code}. Critical issue resolved.`
      })
    })

    // Insert the inspection data
    const { data, error } = await supabase
      .from('inspections')
      .insert(inspections)
      .select()

    if (error) {
      console.error('Error inserting inspections:', error)
      throw error
    }

    console.log(`Successfully seeded ${inspections.length} inspection records`)
    console.log('Sample inspection IDs:', data?.slice(0, 3).map(i => i.id))
    
  } catch (error) {
    console.error('Failed to seed inspections:', error)
    throw error
  }
}

// Run the seeding
seedInspections()
  .then(() => {
    console.log('Seeding completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Seeding failed:', error)
    process.exit(1)
  })
