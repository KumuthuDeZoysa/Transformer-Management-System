import { createBrowserClient } from '@/lib/supabase/client'

export type DbInspection = {
  id: string
  transformer_id: string
  inspection_no: string | null
  inspected_at: string
  maintenance_date: string | null
  status: 'In Progress' | 'Pending' | 'Completed'
  notes: string | null
  created_at: string
  updated_at: string
}

export async function fetchInspections(transformerId?: string): Promise<DbInspection[]> {
  const supabase = createBrowserClient()
  let query = supabase
    .from('inspections')
    .select('id, transformer_id, inspection_no, inspected_at, maintenance_date, status, notes, created_at, updated_at')
    .order('inspected_at', { ascending: false })
  if (transformerId) query = query.eq('transformer_id', transformerId)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as DbInspection[]
}

// Helper function to generate unique inspection number
async function generateInspectionNumber(): Promise<string> {
  const supabase = createBrowserClient()
  
  // Get the latest inspection number to generate the next one
  const { data: latestInspection, error } = await supabase
    .from('inspections')
    .select('inspection_no')
    .not('inspection_no', 'is', null)
    .order('inspection_no', { ascending: false })
    .limit(1)
    .single()
  
  let nextNumber = 13232341 // Default starting number as per format
  
  if (!error && latestInspection?.inspection_no) {
    const currentNumber = parseInt(latestInspection.inspection_no, 10)
    if (!isNaN(currentNumber)) {
      nextNumber = currentNumber + 1
    }
  }
  
  // Format as 10-digit string with leading zeros
  return nextNumber.toString().padStart(10, '0')
}

export async function createInspection(payload: Partial<DbInspection> & { transformer_id: string }) {
  const supabase = createBrowserClient()
  
  // Auto-generate inspection number if not provided
  const inspectionNo = payload.inspection_no || await generateInspectionNumber()
  
  const { data, error } = await supabase.from('inspections').insert({
    transformer_id: payload.transformer_id,
    inspection_no: inspectionNo,
    inspected_at: payload.inspected_at ?? new Date().toISOString(),
    maintenance_date: payload.maintenance_date ?? null,
    status: (payload.status as any) ?? 'Pending',
    notes: payload.notes ?? null,
  }).select('*').single()
  if (error) throw error
  return data as DbInspection
}

export async function updateInspection(id: string, payload: Partial<DbInspection>) {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.from('inspections').update({
    inspection_no: payload.inspection_no,
    inspected_at: payload.inspected_at,
    maintenance_date: payload.maintenance_date,
    status: payload.status as any,
    notes: payload.notes,
  }).eq('id', id).select('*').single()
  if (error) throw error
  return data as DbInspection
}

export async function deleteInspection(id: string) {
  const supabase = createBrowserClient()
  const { error } = await supabase.from('inspections').delete().eq('id', id)
  if (error) throw error
}
