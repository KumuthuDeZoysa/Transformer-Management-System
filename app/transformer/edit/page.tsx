"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { ArrowLeft, Eye } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { fetchTransformersFromDb } from "@/lib/db-api"
import { transformerApi, type Transformer } from "@/lib/mock-api"

// Form data interface for the transformer form


export default function EditTransformerPage() {
  const router = useRouter()
  const [transformersData, setTransformersData] = useState<Transformer[]>([])
  const [loading, setLoading] = useState(true)


  useEffect(() => {
    const loadData = async () => {
      try {
        // Try DB first
        try {
          const dbRows = await fetchTransformersFromDb()
          if (dbRows.length > 0) {
            const mapped: Transformer[] = dbRows.map((r) => ({
              id: r.code || r.id,
              poleNo: r.pole_no || "",
              region: r.region || "",
              type: (r.type as any) || "Distribution",
              capacity: r.capacity || "",
              location: r.location || "",
              status: (r.status as any) || "Normal",
              lastInspection: r.last_inspection || "Not inspected",
              createdAt: r.created_at,
              updatedAt: r.updated_at,
            }))
            setTransformersData(mapped)
            return
          }
        } catch (e) {
          // fall back to mock below
        }

        // Fallback to mock
        const transformers = await transformerApi.getAll()
        setTransformersData(transformers)
      } catch (error) {
        console.error("Failed to load data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])









  const columns = [
    {
      key: "id" as keyof Transformer,
      header: "Transformer No.",
      render: (value: string) => <span className="font-medium">{value}</span>,
    },
    {
      key: "poleNo" as keyof Transformer,
      header: "Pole No.",
    },
    {
      key: "region" as keyof Transformer,
      header: "Region/Branch",
    },
    {
      key: "type" as keyof Transformer,
      header: "Type",
    },
    {
      key: "capacity" as keyof Transformer,
      header: "Capacity",
    },
    {
      key: "location" as keyof Transformer,
      header: "Location",
      render: (value: string) => (
        <span className="max-w-[200px] truncate block" title={value}>
          {value}
        </span>
      ),
    },
    {
      key: "status" as keyof Transformer,
      header: "Status",
      render: (value: string) => <StatusBadge status={value as any} />,
    },
    {
      key: "id" as keyof Transformer,
      header: "View",
      render: (value: string, transformer: Transformer) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => router.push(`/transformer/${transformer.id}`)}
        >
          <Eye className="h-3 w-3" />
        </Button>
      ),
    },
  ]


  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="loading-skeleton h-96 rounded-lg" />
        </div>
      </MainLayout>
    )
  }



  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-sans font-bold text-foreground">Transformers</h1>
            <p className="text-muted-foreground font-serif">View transformer records</p>
          </div>
        </div>

        {/* Transformers List */}
        <DataTable
          data={transformersData}
          columns={columns}
          title="Transformers"
          description="Click the eye icon to view transformer details."
          emptyMessage="No transformers found."
        />
      </div>
    </MainLayout>
  )
}
