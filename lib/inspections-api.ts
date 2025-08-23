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

export async function createInspection(payload: Partial<DbInspection> & { transformer_id: string }) {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.from('inspections').insert({
    transformer_id: payload.transformer_id,
    inspection_no: payload.inspection_no ?? null,
    inspected_at: payload.inspected_at ?? new Date().toISOString(),
    maintenance_date: payload.maintenance_date ?? null,
    status: (payload.status as any) ?? 'Completed',
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
