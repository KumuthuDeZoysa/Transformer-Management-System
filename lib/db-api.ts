import { createBrowserClient } from "@/lib/supabase/client"

export type DbTransformer = {
  id: string
  code: string | null
  pole_no: string | null
  region: string | null
  type: "Distribution" | "Power" | "Bulk" | null
  capacity: string | null
  location: string | null
  status: "Normal" | "Warning" | "Critical" | null
  created_at: string
  updated_at: string
  last_inspection: string | null
}

export async function fetchTransformersFromDb(): Promise<DbTransformer[]> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from("transformers")
    .select("id, code, pole_no, region, type, capacity, location, status, created_at, updated_at, last_inspection")
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as DbTransformer[]
}
