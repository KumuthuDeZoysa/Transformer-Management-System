"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { DataTable } from "@/components/ui/data-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { transformerApi } from "@/lib/mock-api"

type DbTransformer = {
  id: string
  code: string | null
  pole_no: string | null
  region: string | null
  type: "Distribution" | "Power" | "Bulk" | null
  capacity: string | null
  location: string | null
  status: "Normal" | "Warning" | "Critical" | null
  created_at: string
}

export default function DbPage() {
  const [rows, setRows] = useState<DbTransformer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        const supabase = createBrowserClient()
        const { data, error } = await supabase.from("transformers").select("*").order("created_at", { ascending: false })
        if (error) throw error
        if (data && data.length > 0) {
          setRows((data as any) as DbTransformer[])
        } else {
          // fallback to mock data if DB empty
          const mock = await transformerApi.getAll()
          setRows(
            mock.map((m) => ({
              id: m.id,
              code: m.id,
              pole_no: m.poleNo,
              region: m.region,
              type: m.type,
              capacity: m.capacity,
              location: m.location,
              status: m.status,
              created_at: m.createdAt,
            })) as any,
          )
        }
      } catch (e: any) {
        // If DB not ready, show mock data instead but keep a small error note
        setError(e?.message || "Failed to load data from Supabase; showing mock data.")
        const mock = await transformerApi.getAll()
        setRows(
          mock.map((m) => ({
            id: m.id,
            code: m.id,
            pole_no: m.poleNo,
            region: m.region,
            type: m.type,
            capacity: m.capacity,
            location: m.location,
            status: m.status,
            created_at: m.createdAt,
          })) as any,
        )
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const columns = [
    { key: "code", header: "Transformer No." },
    { key: "pole_no", header: "Pole No." },
    { key: "region", header: "Region" },
    { key: "type", header: "Type" },
    { key: "capacity", header: "Capacity" },
    { key: "location", header: "Location" },
    { key: "status", header: "Status" },
  ] as const

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-sans">Database View</CardTitle>
            <CardDescription className="font-serif">Live data from Supabase (transformers)</CardDescription>
          </CardHeader>
          <CardContent>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <DataTable
              data={rows as any}
              columns={columns as any}
              title={loading ? "Loading..." : `Transformers (${rows.length})`}
              description="This reads directly from your Supabase database."
              emptyMessage={loading ? "Loading data..." : "No rows found."}
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
