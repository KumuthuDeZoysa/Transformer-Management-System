"use client"

import { MainLayout } from "@/components/layout/main-layout"
import DeleteConfirmDialog from "@/components/ui/delete-confirm-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/ui/data-table"
import { StatsCard } from "@/components/ui/stats-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { AlertTriangle, CheckCircle, Clock, Plus, Eye, Edit, Trash2, Search, Zap, Activity, Wifi, WifiOff } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { TransformerForm } from "@/components/forms/transformer-form"
import type { TransformerFormData } from "@/components/forms/transformer-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import backendApi from "@/lib/backend-api"
import { type Transformer, type DashboardStats } from "@/lib/types"

const recentAlerts = [
  {
    type: "critical" as const,
    message:
      "Temperature Threshold Exceeded - Transformer AZ-8070 in Nugegoda has exceeded temperature threshold (95°C). Immediate action required.",
    time: "July 25, 2025 - 04:32 AM",
  },
  {
    type: "success" as const,
    message:
      "Maintenance Completed - Scheduled maintenance for Transformer AZ-5678 in Nugegoda has been completed successfully. All parameters normal.",
    time: "July 24, 2025 - 04:32 AM",
  },
  {
    type: "warning" as const,
    message: "Warning: Unusual Vibration Detected - Transformer AZ-9012 showing abnormal vibration patterns.",
    time: "July 23, 2025 - 11:20 PM",
  },
]

export default function TransformersPage() {
  const router = useRouter()
  const [transformersData, setTransformersData] = useState<Transformer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [regionFilter, setRegionFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [showForm, setShowForm] = useState(false)
  const [editingTransformer, setEditingTransformer] = useState<Transformer | undefined>()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Handle client-side mounting to prevent hydration errors
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load transformers data from backend
  useEffect(() => {
    let cancelled = false
    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        const transformers = await backendApi.transformers.getAll()
        if (!cancelled) {
          setTransformersData(transformers)
          
          // Calculate stats from loaded data
          const normal = transformers.filter(t => t.status === "Normal").length
          const warning = transformers.filter(t => t.status === "Warning").length
          const critical = transformers.filter(t => t.status === "Critical").length
          
          setStats({
            totalTransformers: transformers.length,
            operationalTransformers: normal + warning,
            pendingInspections: warning + critical,
            criticalAlerts: critical,
            inspectionsToday: 0, // Will be set from backend later
            maintenanceCompleted: 0, // Will be set from backend later
            statusDistribution: {
              normal,
              warning,
              critical
            }
          })
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load transformers:', err)
          setError(err instanceof Error ? err.message : 'Failed to load data')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadData()
    return () => {
      cancelled = true
    }
  }, [])

  // Filter transformers based on search and filters
  const filteredTransformers = useMemo(() => {
    return transformersData.filter((transformer) => {
      const searchTerm_lower = searchTerm.toLowerCase()
      const matchesSearch =
        (transformer.code?.toLowerCase().includes(searchTerm_lower) ?? false) ||
        (transformer.poleNo?.toLowerCase().includes(searchTerm_lower) ?? false) ||
        (transformer.region?.toLowerCase().includes(searchTerm_lower) ?? false) ||
        (transformer.location?.toLowerCase().includes(searchTerm_lower) ?? false)
      const matchesRegion = regionFilter === "all" || transformer.region === regionFilter
      const matchesType = typeFilter === "all" || transformer.type === typeFilter
      return matchesSearch && matchesRegion && matchesType
    })
  }, [transformersData, searchTerm, regionFilter, typeFilter])

  // Get unique regions and types for filters
  const regions = useMemo(() => {
    const uniqueRegions = [...new Set(transformersData.map(t => t.region).filter(Boolean))]
    return uniqueRegions.sort()
  }, [transformersData])

  const types = useMemo(() => {
    const uniqueTypes = [...new Set(transformersData.map(t => t.type).filter(Boolean))]
    return uniqueTypes.sort()
  }, [transformersData])

  const handleCreateTransformer = async (data: TransformerFormData) => {
    try {
      const newTransformer = await backendApi.transformers.create({
        code: data.id,
        poleNo: data.poleNo,
        region: data.region,
        type: data.type as any,
        capacity: data.capacity,
        location: data.location,
        status: data.status as any,
      })
      setTransformersData(prev => [...prev, newTransformer])
      setShowForm(false)
      setEditingTransformer(undefined)
    } catch (err) {
      console.error('Failed to create transformer:', err)
      alert('Failed to create transformer: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleUpdateTransformer = async (data: TransformerFormData) => {
    if (!editingTransformer) return

    try {
      const updatedTransformer = await backendApi.transformers.update(editingTransformer.id, {
        code: data.id,
        poleNo: data.poleNo,
        region: data.region,
        type: data.type as any,
        capacity: data.capacity,
        location: data.location,
        status: data.status as any,
      })
      setTransformersData(prev => prev.map(t => t.id === editingTransformer.id ? updatedTransformer : t))
      setShowForm(false)
      setEditingTransformer(undefined)
    } catch (err) {
      console.error('Failed to update transformer:', err)
      alert('Failed to update transformer: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleDeleteTransformer = async (id: string) => {
    try {
      await backendApi.transformers.delete(id)
      setTransformersData(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      console.error('Failed to delete transformer:', err)
      alert('Failed to delete transformer: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const openDeleteDialog = (id: string) => {
    setDeleteTargetId(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (deleteTargetId) {
      await handleDeleteTransformer(deleteTargetId)
      setDeleteDialogOpen(false)
      setDeleteTargetId(null)
    }
  }

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false)
    setDeleteTargetId(null)
  }

  const columns = [
    {
      key: 'code' as keyof Transformer,
      header: 'Code',
      render: (value: string | null) => <span className="font-mono">{value || 'N/A'}</span>
    },
    {
      key: 'poleNo' as keyof Transformer,
      header: 'Pole No.'
    },
    {
      key: 'region' as keyof Transformer,
      header: 'Region'
    },
    {
      key: 'type' as keyof Transformer,
      header: 'Type'
    },
    {
      key: 'capacity' as keyof Transformer,
      header: 'Capacity'
    },
    {
      key: 'status' as keyof Transformer,
      header: 'Status',
      render: (value: string) => <StatusBadge status={value as any} />
    },
    {
      key: 'id' as keyof Transformer,
      header: 'Actions',
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
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => {
              setEditingTransformer(transformer)
              setShowForm(true)
            }}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive"
            onClick={() => openDeleteDialog(transformer.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )
    }
  ]

  // Prevent hydration errors by not rendering until mounted
  if (!mounted || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading transformers...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <>
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        title="Delete Transformer"
        description="Are you sure you want to delete this transformer? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={closeDeleteDialog}
        confirmText="Delete"
        cancelText="Cancel"
      />
      
      <MainLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Transformers</h1>
              <p className="text-muted-foreground">Manage and monitor power transformers</p>
            </div>
            <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Transformer
            </Button>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Total Transformers"
                value={stats.totalTransformers}
                icon={Zap}
                trend={{ value: 0, label: "from last month" }}
                description="All registered transformers"
              />
              <StatsCard
                title="Operational"
                value={stats.operationalTransformers}
                icon={CheckCircle}
                trend={{ value: 0, label: "from last month" }}
                description="Currently operational"
              />
              <StatsCard
                title="Pending Inspections"
                value={stats.pendingInspections}
                icon={Clock}
                trend={{ value: 0, label: "from last week" }}
                description="Require attention"
              />
              <StatsCard
                title="Critical Alerts"
                value={stats.criticalAlerts}
                icon={AlertTriangle}
                trend={{ value: 0, label: "from last week" }}
                description="Immediate action needed"
              />
            </div>
          )}

          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle>Transformer Management</CardTitle>
              <CardDescription>Search and filter transformers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search transformers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={regionFilter} onValueChange={setRegionFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Regions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    {regions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {types.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DataTable 
                data={filteredTransformers} 
                columns={columns}
                emptyMessage="No transformers found"
              />
            </CardContent>
          </Card>

          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>Latest system notifications and warnings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAlerts.map((alert, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border">
                    {alert.type === "critical" && <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />}
                    {alert.type === "warning" && <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />}
                    {alert.type === "success" && <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transformer Form Modal */}
        {showForm && (
          <TransformerForm
            open={showForm}
            onClose={() => {
              setShowForm(false)
              setEditingTransformer(undefined)
            }}
            onSubmit={editingTransformer ? handleUpdateTransformer : handleCreateTransformer}
            transformer={editingTransformer}
            existingTransformers={transformersData}
          />
        )}
      </MainLayout>
    </>
  )
}