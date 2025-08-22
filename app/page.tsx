"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/ui/data-table"
import { StatsCard } from "@/components/ui/stats-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { AlertTriangle, CheckCircle, Clock, Plus, Eye, Edit, Trash2, Search, Zap, Activity } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { TransformerForm } from "@/components/forms/transformer-form"
import { transformerApi, statsApi, type Transformer } from "@/lib/mock-api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Form data interface for the transformer form
interface TransformerFormData {
  id: string
  poleNo: string
  region: string
  type: "Distribution" | "Power" | "Bulk"
  capacity: string
  location: string
}

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
  const [searchTerm, setSearchTerm] = useState("")
  const [regionFilter, setRegionFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [showForm, setShowForm] = useState(false)
  const [editingTransformer, setEditingTransformer] = useState<Transformer | undefined>()
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [transformers, dashboardStats] = await Promise.all([
          transformerApi.getAll(),
          statsApi.getDashboardStats(),
        ])
        setTransformersData(transformers)
        setStats(dashboardStats)
      } catch (error) {
        console.error("Failed to load data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredTransformers = transformersData.filter((transformer) => {
    const matchesSearch =
      transformer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transformer.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRegion = regionFilter === "all" || transformer.region === regionFilter
    const matchesType = typeFilter === "all" || transformer.type === typeFilter

    return matchesSearch && matchesRegion && matchesType
  })

  const uniqueRegions = [...new Set(transformersData.map((t) => t.region))]
  const uniqueTypes = [...new Set(transformersData.map((t) => t.type))]

  const handleFormSubmit = async (formData: TransformerFormData) => {
    try {
      if (editingTransformer) {
        // Update existing transformer with form data
        const updatedTransformer: Transformer = {
          ...formData,
          status: editingTransformer.status,
          lastInspection: editingTransformer.lastInspection,
          createdAt: editingTransformer.createdAt,
          updatedAt: new Date().toISOString(),
        }
        await transformerApi.update(editingTransformer.id, updatedTransformer)
        setTransformersData((prev) =>
          prev.map((t) =>
            t.id === editingTransformer.id ? updatedTransformer : t,
          ),
        )
      } else {
        // Create new transformer with default values
        const newTransformerData: Transformer = {
          ...formData,
          status: "Normal" as const,
          lastInspection: "Not inspected",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        const newTransformer = await transformerApi.create(newTransformerData)
        setTransformersData((prev) => [...prev, newTransformer])
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

  const handleEdit = (transformer: Transformer) => {
    setEditingTransformer(transformer)
    setShowForm(true)
  }

  const handleDelete = async (transformerId: string) => {
    if (confirm("Are you sure you want to delete this transformer?")) {
      try {
        await transformerApi.delete(transformerId)
        setTransformersData((prev) => prev.filter((t) => t.id !== transformerId))
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="loading-skeleton h-24 rounded-lg" />
            ))}
          </div>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-sans font-bold text-foreground">Transformer Management</h1>
            <p className="text-muted-foreground font-serif">Manage transformer records and inspections</p>
          </div>
          <Button className="button-primary" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Transformer
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard
            title="Total Transformers"
            value={stats?.totalTransformers || 0}
            description="Currently operational"
            icon={Zap}
          />
          <StatsCard
            title="Pending Inspections"
            value={stats?.pendingInspections || 0}
            description="Require attention"
            icon={Clock}
          />
          <StatsCard
            title="Critical Alerts"
            value={stats?.criticalAlerts || 0}
            description="Immediate action needed"
            icon={AlertTriangle}
            className="text-destructive"
          />
          <StatsCard
            title="Inspections Today"
            value={stats?.inspectionsToday || 0}
            description="Completed successfully"
            icon={Activity}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DataTable
              data={filteredTransformers}
              columns={columns}
              title="Transformers"
              description="Manage transformer records and data"
              actions={
                <div className="flex flex-col sm:flex-row gap-4 w-full">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by Transformer No. or Location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 font-serif focus-ring"
                    />
                  </div>
                  <Select value={regionFilter} onValueChange={setRegionFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] font-serif focus-ring">
                      <SelectValue placeholder="Filter by Region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Regions</SelectItem>
                      {uniqueRegions.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] font-serif focus-ring">
                      <SelectValue placeholder="Filter by Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {uniqueTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              }
              emptyMessage="No transformers found matching your search criteria."
            />
          </div>

          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="font-sans">Recent Alerts</CardTitle>
              <CardDescription className="font-serif">Latest system notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentAlerts.map((alert, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50 border border-border/50"
                >
                  {alert.type === "critical" && (
                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                  )}
                  {alert.type === "success" && <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />}
                  {alert.type === "warning" && (
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-serif text-foreground leading-relaxed">{alert.message}</p>
                    <p className="text-xs text-muted-foreground font-serif mt-1">{alert.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
