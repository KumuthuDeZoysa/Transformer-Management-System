


import { createBrowserClient } from "@/lib/supabase/client"

function randomId() {
  return 'TP-' + Math.random().toString(36).substring(2, 8).toUpperCase()
}
function randomPoleNo() {
  return 'POLE-' + Math.floor(Math.random() * 1000)
}
function randomRegion() {
  const regions = ['Maharagama', 'Nugegoda', 'Colombo', 'Dehiwala', 'Mount Lavinia', 'Ratmalana', 'Moratuwa', 'Panadura', 'Kalutara','Kesbewa', 'Homagama', 'Kottawa', 'Piliyandala', 'Boralesgamuwa']
  return regions[Math.floor(Math.random() * regions.length)]
}
function randomType() {
  return Math.random() > 0.5 ? 'Distribution' : 'Bulk'
}
function randomCapacity() {
  return Math.floor(Math.random() * 2000 + 10) + ' kVA'
}
function randomLocation() {
  const locs = ['Main St', '2nd Ave', 'Park Rd', 'Industrial Zone', 'Suburb']
  return locs[Math.floor(Math.random() * locs.length)] + ', Area ' + Math.floor(Math.random() * 100)
}
function randomDate() {
  const start = new Date(2022, 0, 1).getTime()
  const end = new Date().getTime()
  return new Date(start + Math.random() * (end - start)).toISOString()
}

export async function seedTransformers() {
  const supabase = createBrowserClient()
  const transformers = Array.from({ length: 5 }).map(() => ({
    code: randomId(),
    pole_no: randomPoleNo(),
    region: randomRegion(),
    type: randomType(),
    capacity: randomCapacity(),
    location: randomLocation(),
    status: 'Normal', // always lowercase for DB
    created_at: randomDate(),
    updated_at: randomDate()
  }))
  const { error } = await supabase.from("transformers").insert(transformers)
  if (error) throw error
  return true
}
