"use client"

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { fetchInspections, createInspection, updateInspection, deleteInspection, type DbInspection } from '@/lib/inspections-api'
import { fetchTransformersFromDb, type DbTransformer } from '@/lib/db-api'
import { Eye, Search, Plus, Edit, Trash2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import DeleteConfirmDialog from '@/components/ui/delete-confirm-dialog'

type Row = {
  id: string
  transformerId: string
  inspectionNo: string
  inspectedDate: string
  maintenanceDate: string
  status: 'In Progress' | 'Pending' | 'Completed'
}

export default function InspectionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [rows, setRows] = useState<Row[]>([])
  const [transformerMap, setTransformerMap] = useState<Map<string, DbTransformer>>(new Map())
  const [transformers, setTransformers] = useState<DbTransformer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    transformer_id: '',
    inspected_date: '',
    inspected_time: '',
    branch: '',
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [ins, transformers] = await Promise.all([
          fetchInspections(),
          fetchTransformersFromDb(),
        ])
        const tMap = new Map<string, DbTransformer>()
        transformers.forEach((t) => tMap.set(t.id, t))
        setTransformerMap(tMap)
        setTransformers(transformers)
        
        const mapped: Row[] = ins.map((i) => ({
          id: i.id,
          transformerId: tMap.get(i.transformer_id)?.code || i.transformer_id,
          inspectionNo: i.inspection_no || '—',
          inspectedDate: new Date(i.inspected_at).toLocaleString(),
          maintenanceDate: i.maintenance_date ? new Date(i.maintenance_date).toLocaleString() : '—',
          status: i.status,
        }))

        // Add some demo data to show maintenance dates functionality
        const demoData: Row[] = [
          {
            id: 'demo-1',
            transformerId: 'AZ-8890',
            inspectionNo: '0013232345',
            inspectedDate: '8/24/2025, 11:40:00 AM',
            maintenanceDate: '8/26/2025, 2:30:00 PM',
            status: 'Completed'
          },
          {
            id: 'demo-2', 
            transformerId: 'AZ-4613',
            inspectionNo: '0013232346',
            inspectedDate: '8/23/2025, 7:14:00 PM',
            maintenanceDate: '—',
            status: 'Pending'
          },
          {
            id: 'demo-3',
            transformerId: 'AZ-4613', 
            inspectionNo: '0013232341',
            inspectedDate: '8/23/2025, 11:28:11 AM',
            maintenanceDate: '—',
            status: 'In Progress'
          },
          {
            id: 'demo-4',
            transformerId: 'AZ-8890',
            inspectionNo: '0013232344',
            inspectedDate: '8/22/2025, 3:39:00 PM',
            maintenanceDate: '8/23/2025, 10:15:00 AM',
            status: 'Completed'
          },
          {
            id: 'demo-5',
            transformerId: 'AZ-7316',
            inspectionNo: '0013232343',
            inspectedDate: '8/21/2025, 11:17:00 AM',
            maintenanceDate: '—',
            status: 'Pending'
          },
          {
            id: 'demo-6',
            transformerId: 'AX-8993',
            inspectionNo: '0013232342',
            inspectedDate: '8/20/2025, 10:15:00 AM',
            maintenanceDate: '8/22/2025, 4:45:00 PM',
            status: 'Completed'
          },
          {
            id: 'demo-7',
            transformerId: 'EN-122A',
            inspectionNo: '0013232340',
            inspectedDate: '8/19/2025, 9:30:00 AM',
            maintenanceDate: '8/21/2025, 1:20:00 PM',
            status: 'Completed'
          },
          {
            id: 'demo-8',
            transformerId: 'LP-2567',
            inspectionNo: '0013232339',
            inspectedDate: '8/18/2025, 2:45:00 PM',
            maintenanceDate: '—',
            status: 'In Progress'
          }
        ]
        
        setRows([...mapped, ...demoData])

        // If a transformer is passed via query, preselect it and open the Add dialog
        const qpId = searchParams.get('transformer_id') || ''
        const qpCode = searchParams.get('transformer') || ''
        if (!addOpen && (qpId || qpCode)) {
          const match = qpId
            ? transformers.find((t) => t.id === qpId)
            : transformers.find((t) => (t.code || '').toLowerCase() === qpCode.toLowerCase())
          if (match) {
            setForm((f) => ({ ...f, transformer_id: match.id }))
            setAddOpen(true)
          }
        }
      } catch (e) {
        console.error('Failed to load inspections', e)
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
        r.transformerId.toLowerCase().includes(term) ||
        r.inspectionNo.toLowerCase().includes(term)
      const statusOk = statusFilter === 'all' || r.status.toLowerCase() === statusFilter
      return matches && statusOk
    })
  }, [rows, search, statusFilter])

  const columns = [
    { key: 'transformerId', header: 'Transformer No.' },
    { key: 'inspectionNo', header: 'Inspection No' },
    { key: 'inspectedDate', header: 'Inspected Date' },
    { 
      key: 'maintenanceDate', 
      header: 'Maintenance Date',
      render: (value: string, row: Row) => {
        if (row.status === 'Completed' && value !== '—') {
          return (
            <div className="text-green-700 font-medium">
              {value}
            </div>
          )
        } else if (row.status === 'Completed' && value === '—') {
          return (
            <div className="text-amber-600 font-medium">
              Pending
            </div>
          )
        }
        return <span className="text-muted-foreground">{value}</span>
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (v: Row['status']) => (
        <Badge variant={v === 'Completed' ? 'outline' : v === 'Pending' ? 'secondary' : 'default'}>{v}</Badge>
      ),
    },
    {
      key: 'id',
      header: 'Actions',
      render: (_: string, r: Row) => (
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 cursor-pointer hover:bg-accent transition-colors" 
            onClick={() => router.push(`/inspections/${r.id}`)}
          >
            <Eye className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 cursor-pointer hover:bg-accent transition-colors" 
            onClick={() => onEdit(r.id)} 
            title="Edit"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-destructive cursor-pointer hover:bg-accent transition-colors" 
            onClick={() => onDelete(r.id)} 
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ]

  const resetForm = () => setForm({
    transformer_id: '',
    inspected_date: '',
    inspected_time: '',
    branch: '',
  })

  const submit = async () => {
    if (!form.transformer_id) return alert('Please select a transformer')
    if (!form.inspected_date) return alert('Please select inspection date')
    if (!form.inspected_time) return alert('Please select inspection time')
    
    setSaving(true)
    try {
      // Combine date and time for inspected_at
      const inspectedAt = new Date(`${form.inspected_date}T${form.inspected_time}`).toISOString()
      
      const payload = {
        transformer_id: form.transformer_id,
        inspected_at: inspectedAt,
        status: 'Pending' as DbInspection['status'], // Default status for new inspections
        notes: form.branch ? `Branch: ${form.branch}` : null, // Store branch info in notes
      }
      
      if (editingId) {
        await updateInspection(editingId, payload as any)
      } else {
        await createInspection(payload as any)
      }
      
      // refresh list
      const latest = await fetchInspections()
      const mapped: Row[] = latest.map((i) => ({
        id: i.id,
        transformerId: transformerMap.get(i.transformer_id)?.code || i.transformer_id,
        inspectionNo: i.inspection_no || '—',
        inspectedDate: new Date(i.inspected_at).toLocaleString(),
        maintenanceDate: i.maintenance_date ? new Date(i.maintenance_date).toLocaleString() : '—',
        status: i.status,
      }))
      setRows(mapped)
      setAddOpen(false)
      setEditingId(null)
      resetForm()
    } catch (e: any) {
      alert(e.message || 'Failed to create inspection')
    } finally {
      setSaving(false)
    }
  }

  const onEdit = (id: string) => {
    const row = rows.find((r) => r.id === id)
    if (!row) return
    const transformer = transformers.find((t) => (t.code || t.id) === row.transformerId || t.id === row.transformerId)
    
    // Parse the date and time from inspectedDate
    const inspectedDate = new Date(row.inspectedDate)
    const dateStr = inspectedDate.toISOString().split('T')[0] // YYYY-MM-DD
    const timeStr = inspectedDate.toTimeString().split(' ')[0].slice(0, 5) // HH:MM
    
    setForm({
      transformer_id: transformer?.id || '',
      inspected_date: dateStr,
      inspected_time: timeStr,
      branch: transformer?.region || '', // Use transformer region as branch
    })
    setEditingId(id)
    setAddOpen(true)
  }

  const onDelete = (id: string) => {
    setDeleteTargetId(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteTargetId) return
    try {
      await deleteInspection(deleteTargetId)
      const latest = await fetchInspections()
      const mapped: Row[] = latest.map((i) => ({
        id: i.id,
        transformerId: transformerMap.get(i.transformer_id)?.code || i.transformer_id,
        inspectionNo: i.inspection_no || '—',
        inspectedDate: new Date(i.inspected_at).toLocaleString(),
        maintenanceDate: i.maintenance_date ? new Date(i.maintenance_date).toLocaleString() : '—',
        status: i.status,
      }))
      setRows(mapped)
    } catch (e: any) {
      alert(e.message || 'Delete failed')
    } finally {
      setDeleteDialogOpen(false)
      setDeleteTargetId(null)
    }
  }

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false)
    setDeleteTargetId(null)
  }

  return (
    <>
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        title="Delete Inspection"
        description="Are you sure you want to delete this inspection? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={closeDeleteDialog}
        confirmText="Delete"
        cancelText="Cancel"
      />
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-sans font-bold text-foreground">All Inspections</h1>
              <p className="text-muted-foreground font-serif">Browse and manage inspection records</p>
            </div>
            <Button className="button-primary cursor-pointer hover:bg-primary/90 transition-colors" onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Inspection
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-sans">Filters</CardTitle>
              <CardDescription className="font-serif">Search and filter inspections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10 font-serif" placeholder="Search Transformer or Inspection No" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="font-serif">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="in progress">In Progress</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <div />
              </div>
            </CardContent>
          </Card>

          <DataTable
            data={filtered}
            columns={columns as any}
            title="Inspections"
            description="Inspection records pulled from the database"
            emptyMessage={loading ? 'Loading…' : 'No inspections found.'}
          />

          <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) resetForm() }}>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle className="font-sans">{editingId ? 'Edit Inspection' : 'Add Inspection'}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="md:col-span-2">
                  <label className="text-sm text-muted-foreground font-serif">Transformer No.</label>
                  <Select value={form.transformer_id} onValueChange={(v) => {
                    const transformer = transformers.find(t => t.id === v)
                    setForm((f) => ({ 
                      ...f, 
                      transformer_id: v,
                      branch: transformer?.region || '' // Auto-fill branch from transformer region
                    }))
                  }}>
                    <SelectTrigger className="font-serif mt-1">
                      <SelectValue placeholder="Select transformer" />
                    </SelectTrigger>
                    <SelectContent>
                      {transformers.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.code || t.id} — {t.region || t.location || '-'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground font-serif">Branch</label>
                  <Input 
                    className="font-serif mt-1" 
                    placeholder="Branch/Region" 
                    value={form.branch}
                    onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))} 
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground font-serif">Date of Inspection</label>
                  <Input 
                    type="date" 
                    className="font-serif mt-1" 
                    value={form.inspected_date}
                    onChange={(e) => setForm((f) => ({ ...f, inspected_date: e.target.value }))} 
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm text-muted-foreground font-serif">Time</label>
                  <Input 
                    type="time" 
                    className="font-serif mt-1" 
                    value={form.inspected_time}
                    onChange={(e) => setForm((f) => ({ ...f, inspected_time: e.target.value }))} 
                  />
                </div>

                <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                  <Button variant="outline" className="bg-transparent font-serif cursor-pointer hover:bg-accent transition-colors" onClick={() => { setAddOpen(false); setEditingId(null); resetForm() }}>Cancel</Button>
                  <Button className="font-serif cursor-pointer hover:bg-primary/90 transition-colors" onClick={submit} disabled={saving}>{saving ? 'Saving...' : (editingId ? 'Save Changes' : 'Save Inspection')}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </MainLayout>
    </>
  )
}
