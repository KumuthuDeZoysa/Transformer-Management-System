"use client"

import { useEffect, useState, useMemo } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { Eye, Search, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { maintenanceRecordApi } from '@/lib/maintenance-record-api'
import backendApi from '@/lib/backend-api'
import { MaintenanceRecord } from '@/lib/types'

type Row = {
  id: string
  transformerCode: string
  inspectionNo: string
  inspectorName: string
  status: 'OK' | 'Needs Maintenance' | 'Urgent Attention' | null
  completionDate: string
  createdAt: string
}

export default function MaintenanceRecordsPage() {
  const router = useRouter()
  const [rows, setRows] = useState<Row[]>([])
  const [transformerMap, setTransformerMap] = useState<Map<string, any>>(new Map())
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        console.log('🔄 Loading maintenance records...')
        
        // Check if backend is accessible
        const healthStatus = await backendApi.health.checkBackendStatus()
        console.log('Backend health check:', healthStatus)
        
        if (healthStatus.status === 'unhealthy') {
          console.warn('⚠️ Backend is not accessible')
          setLoading(false)
          return
        }
        
        const [records, transformers, inspections] = await Promise.all([
          maintenanceRecordApi.getAll(),
          backendApi.transformers.getAll(),
          backendApi.inspections.getAll(),
        ])
        
        console.log('Backend returned:', { 
          records: records.length, 
          transformers: transformers.length,
          inspections: inspections.length
        })
        
        const tMap = new Map<string, any>()
        transformers.forEach((t) => tMap.set(t.id, t))
        setTransformerMap(tMap)

        const iMap = new Map<string, any>()
        inspections.forEach((i) => iMap.set(i.id, i))
        
        const mapped: Row[] = records.map((r) => {
          const transformer = r.transformer?.id ? tMap.get(r.transformer.id) : null
          const inspection = r.inspection?.id ? iMap.get(r.inspection.id) : null
          
          return {
            id: r.id,
            transformerCode: transformer?.code || 'Unknown',
            inspectionNo: inspection?.inspectionNo || '—',
            inspectorName: r.inspectorName || '—',
            status: r.transformerStatus,
            completionDate: r.completionDate 
              ? new Date(r.completionDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })
              : '—',
            createdAt: new Date(r.createdAt).toLocaleString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
          }
        })

        console.log('📊 Mapped maintenance records:', mapped.length)
        setRows(mapped)
      } catch (e) {
        console.error('❌ Failed to load maintenance records:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const term = search.toLowerCase()
    return rows.filter((r) => {
      const matches =
        r.transformerCode.toLowerCase().includes(term) ||
        r.inspectionNo.toLowerCase().includes(term) ||
        r.inspectorName.toLowerCase().includes(term)
      const statusOk = statusFilter === 'all' || 
        (r.status && r.status.toLowerCase().replace(' ', '-') === statusFilter)
      return matches && statusOk
    })
  }, [rows, search, statusFilter])

  const getStatusBadgeVariant = (status: string | null) => {
    switch (status) {
      case 'OK':
        return 'default'
      case 'Needs Maintenance':
        return 'secondary'
      case 'Urgent Attention':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const columns = [
    { key: 'transformerCode', header: 'Transformer No.' },
    { key: 'inspectionNo', header: 'Inspection No' },
    { key: 'inspectorName', header: 'Inspector' },
    {
      key: 'status',
      header: 'Status',
      render: (v: Row['status']) => (
        <Badge variant={getStatusBadgeVariant(v)}>{v || '—'}</Badge>
      ),
    },
    { key: 'completionDate', header: 'Completion Date' },
    { key: 'createdAt', header: 'Created At' },
    {
      key: 'id',
      header: 'Actions',
      render: (_: string, r: Row) => (
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 cursor-pointer hover:bg-accent transition-colors" 
            onClick={() => router.push(`/maintenance-records/${r.id}`)}
          >
            <Eye className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-sans font-bold text-foreground">Maintenance Records</h1>
            <p className="text-muted-foreground font-serif">
              Browse and manage transformer maintenance record sheets
            </p>
          </div>
          <Button 
            className="button-primary cursor-pointer hover:bg-primary/90 transition-colors" 
            onClick={() => router.push('/inspections')}
          >
            <FileText className="mr-2 h-4 w-4" />
            Go to Inspections
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-sans">Filters</CardTitle>
            <CardDescription className="font-serif">Search and filter maintenance records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  className="pl-10 font-serif" 
                  placeholder="Search Transformer, Inspection No, or Inspector" 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="font-serif">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ok">OK</SelectItem>
                  <SelectItem value="needs-maintenance">Needs Maintenance</SelectItem>
                  <SelectItem value="urgent-attention">Urgent Attention</SelectItem>
                </SelectContent>
              </Select>
              <div />
            </div>
          </CardContent>
        </Card>

        <DataTable
          data={filtered}
          columns={columns as any}
          title="Maintenance Records"
          description="All maintenance record sheets generated from inspections"
          emptyMessage={loading ? 'Loading…' : 'No maintenance records found.'}
        />
      </div>
    </MainLayout>
  )
}
