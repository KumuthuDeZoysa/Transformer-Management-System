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
import backendApi, { type BackendTransformer } from "@/lib/backend-api"
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
  const [backendConnected, setBackendConnected] = useState(false)
  const [dataSource, setDataSource] = useState<'backend' | 'mock'>('backend')

  // Helper function to convert backend transformer to frontend format
  const convertBackendTransformer = (bt: BackendTransformer): Transformer => ({
    id: bt.code || bt.id,
    poleNo: bt.poleNo || "",
    region: bt.region || "",
    type: (bt.type as any) || "Distribution",
    capacity: bt.capacity || "",
    location: bt.location || "",
    status: bt.status || "Normal",
    lastInspection: bt.lastInspection || "Not inspected",
    createdAt: bt.createdAt,
    updatedAt: bt.updatedAt,
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        // First, check if backend is available
        const healthCheck = await backendApi.health.checkBackendStatus()
        setBackendConnected(healthCheck.status === 'healthy')

        if (healthCheck.status === 'healthy') {
          // Use Spring Boot backend
          console.log('🚀 Loading transformers from Spring Boot backend...')
          const backendTransformers = await backendApi.transformers.getAll()
          const converted = backendTransformers.map(convertBackendTransformer)
          setTransformersData(converted)
          setDataSource('backend')
          return
        }

        // Fallback to mock data
        console.log('📡 Backend unavailable, falling back to mock data...')
        const transformers = await transformerApi.getAll()
        setTransformersData(transformers)
        setDataSource('mock')
      } catch (error) {
        console.error("Failed to load data:", error)
        // Final fallback to mock
        try {
          const transformers = await transformerApi.getAll()
          setTransformersData(transformers)
          setDataSource('mock')
        } catch (mockError) {
          console.error("Mock data also failed:", mockError)
        }
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleFormSubmit = async (formData: TransformerFormData) => {
    try {
      if (editingTransformer) {
        // Update existing transformer
        if (backendConnected) {
          console.log('🔄 Updating transformer via backend API...')
          const updated = await backendApi.transformers.update(editingTransformer.id, {
            code: formData.id,
            poleNo: formData.poleNo,
            region: formData.region,
            type: formData.type,
            capacity: formData.capacity,
            location: formData.location,
          })
          
          // Refresh the list
          const backendTransformers = await backendApi.transformers.getAll()
          const converted = backendTransformers.map(convertBackendTransformer)
          setTransformersData(converted)
        } else {
          // Fallback: Update using local mock API
          console.log('🔄 Updating transformer via mock API...')
          await transformerApi.update(editingTransformer.id, {
            poleNo: formData.poleNo,
            region: formData.region,
            type: formData.type,
            capacity: formData.capacity,
            location: formData.location,
          })
          const transformers = await transformerApi.getAll()
          setTransformersData(transformers)
        }
      } else {
        // Create new transformer
        if (backendConnected) {
          console.log('➕ Creating transformer via backend API...')
          await backendApi.transformers.create({
            code: formData.id,
            poleNo: formData.poleNo,
            region: formData.region,
            type: formData.type,
            capacity: formData.capacity,
            location: formData.location,
            status: 'Normal',
          })
          
          // Refresh the list
          const backendTransformers = await backendApi.transformers.getAll()
          const converted = backendTransformers.map(convertBackendTransformer)
          setTransformersData(converted)
        } else {
          // Fallback: Create using local mock API
          console.log('➕ Creating transformer via mock API...')
          await transformerApi.create({
            id: formData.id,
            poleNo: formData.poleNo,
            region: formData.region,
            type: formData.type,
            capacity: formData.capacity,
            location: formData.location,
            status: 'Normal',
            lastInspection: 'Not inspected',
          })
          const transformers = await transformerApi.getAll()
          setTransformersData(transformers)
        }
      }
      setShowForm(false)
      setEditingTransformer(undefined)
    } catch (error) {
      console.error("Failed to save transformer:", error)
      alert(`Failed to save transformer: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingTransformer(undefined)
  }

  const handleEdit = async (transformer: Transformer) => {
    try {
      if (backendConnected) {
        console.log('🔍 Fetching transformer details from backend...')
        const backendTransformer = await backendApi.transformers.getById(transformer.id)
        const converted = convertBackendTransformer(backendTransformer)
        setEditingTransformer(converted)
      } else {
        console.log('🔍 Using local transformer data...')
        setEditingTransformer(transformer)
      }
    } catch (error) {
      console.error('Failed to fetch transformer details:', error)
      setEditingTransformer(transformer)
    }
    setShowForm(true)
  }

  const handleDelete = async (transformerId: string) => {
    if (confirm("Are you sure you want to delete this transformer?")) {
      try {
        if (backendConnected) {
          console.log('🗑️ Deleting transformer via backend API...')
          await backendApi.transformers.delete(transformerId)
          
          // Refresh the list
          const backendTransformers = await backendApi.transformers.getAll()
          const converted = backendTransformers.map(convertBackendTransformer)
          setTransformersData(converted)
        } else {
          console.log('🗑️ Deleting transformer via mock API...')
          await transformerApi.delete(transformerId)
          const transformers = await transformerApi.getAll()
          setTransformersData(transformers)
        }
      } catch (error) {
        console.error("Failed to delete transformer:", error)
        alert(`Failed to delete transformer: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
