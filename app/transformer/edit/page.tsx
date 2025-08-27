"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { ArrowLeft, Plus, Edit, Trash2, Eye } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { TransformerForm } from "@/components/forms/transformer-form"
import { fetchTransformersFromDb } from "@/lib/db-api"
import { transformerApi, type Transformer } from "@/lib/mock-api"

// Form data interface for the transformer form
interface TransformerFormData {
  id: string
  poleNo: string
  region: string
  type: "Distribution" | "Bulk"
  capacity: string
  location: string
}

export default function EditTransformerPage() {
  const router = useRouter()
  const [transformersData, setTransformersData] = useState<Transformer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTransformer, setEditingTransformer] = useState<Transformer | undefined>()

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

  const handleFormSubmit = async (formData: TransformerFormData) => {
    try {
      if (editingTransformer) {
        // Update existing
        const res = await fetch(`/api/transformers/${editingTransformer.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            poleNo: formData.poleNo,
            region: formData.region,
            type: formData.type,
            capacity: formData.capacity,
            location: formData.location,
          }),
        })
        const updated = await res.json()
        if (!res.ok) throw new Error(updated?.error || 'Update failed')
        
        // Refresh list from DB
        try {
          const dbRows = await fetchTransformersFromDb()
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
        } catch {
          // fallback to local update
          const updatedTransformer: Transformer = {
            id: updated.code || updated.id,
            poleNo: updated.pole_no || '',
            region: updated.region || '',
            type: (updated.type as any) || 'Distribution',
            capacity: updated.capacity || '',
            location: updated.location || '',
            status: (updated.status as any) || 'Normal',
            lastInspection: updated.last_inspection || editingTransformer.lastInspection,
            createdAt: updated.created_at || editingTransformer.createdAt,
            updatedAt: updated.updated_at || new Date().toISOString(),
          }
          setTransformersData((prev) => prev.map((t) => (t.id === editingTransformer.id ? updatedTransformer : t)))
        }
      } else {
        // Create new
        const res = await fetch('/api/transformers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: formData.id,
            poleNo: formData.poleNo,
            region: formData.region,
            type: formData.type,
            capacity: formData.capacity,
            location: formData.location,
          }),
        })
        const created = await res.json()
        if (!res.ok) throw new Error(created?.error || 'Create failed')
        
        try {
          const dbRows = await fetchTransformersFromDb()
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
        } catch {
          const newTransformer: Transformer = {
            id: created.code || created.id,
            poleNo: created.pole_no || '',
            region: created.region || '',
            type: (created.type as any) || 'Distribution',
            capacity: created.capacity || '',
            location: created.location || '',
            status: (created.status as any) || 'Normal',
            lastInspection: created.last_inspection || 'Not inspected',
            createdAt: created.created_at || new Date().toISOString(),
            updatedAt: created.updated_at || new Date().toISOString(),
          }
          setTransformersData((prev) => [...prev, newTransformer])
        }
      }
      setShowForm(false)
      setEditingTransformer(undefined)
    } catch (error) {
      console.error("Failed to save transformer:", error)
    }
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingTransformer(undefined)
  }

  const handleEdit = async (transformer: Transformer) => {
    try {
      const res = await fetch(`/api/transformers/${transformer.id}`)
      if (res.ok) {
        const t = await res.json()
        const mapped: Transformer = {
          id: t.code || t.id,
          poleNo: t.pole_no || "",
          region: t.region || "",
          type: (t.type as any) || "Distribution",
          capacity: t.capacity || "",
          location: t.location || "",
          status: (t.status as any) || "Normal",
          lastInspection: t.last_inspection || transformer.lastInspection,
          createdAt: t.created_at || transformer.createdAt,
          updatedAt: t.updated_at || transformer.updatedAt,
        }
        setEditingTransformer(mapped)
      } else {
        setEditingTransformer(transformer)
      }
    } catch {
      setEditingTransformer(transformer)
    }
    setShowForm(true)
  }

  const handleDelete = async (transformerId: string) => {
    if (confirm("Are you sure you want to delete this transformer?")) {
      try {
        const res = await fetch(`/api/transformers/${transformerId}`, { method: 'DELETE' })
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          throw new Error(j?.error || 'Delete failed')
        }
        try {
          const dbRows = await fetchTransformersFromDb()
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
        } catch {
          setTransformersData((prev) => prev.filter((t) => t.id !== transformerId))
        }
      } catch (error) {
        console.error("Failed to delete transformer:", error)
      }
    }
  }

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
      header: "Actions",
      render: (value: string, transformer: Transformer) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => router.push(`/transformer/${transformer.id}`)}
          >
            <Eye className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(transformer)}>
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            onClick={() => handleDelete(transformer.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
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

  if (showForm) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto py-6">
          <TransformerForm
            transformer={editingTransformer}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            existingTransformers={transformersData}
          />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-sans font-bold text-foreground">Add/Edit Transformer</h1>
              <p className="text-muted-foreground font-serif">Manage transformer records</p>
            </div>
          </div>
          <Button className="button-primary" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Transformer
          </Button>
        </div>

        {/* Transformers List */}
        <DataTable
          data={transformersData}
          columns={columns}
          title="Transformers"
          description="Click Edit to modify or Add Transformer to create new"
          emptyMessage="No transformers found. Click Add Transformer to create one."
        />
      </div>
    </MainLayout>
  )
}
