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
    inspection_no: '',
    inspected_at: '',
    maintenance_date: '',
    status: 'Completed' as DbInspection['status'],
    notes: '',
  })

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
        setRows(mapped)

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
    { key: 'maintenanceDate', header: 'Maintenance Date' },
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
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => router.push(`/transformer/${r.transformerId}`)}>
            <Eye className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onEdit(r.id)} title="Edit">
            <Edit className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => onDelete(r.id)} title="Delete">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ]

  const resetForm = () => setForm({
    transformer_id: '',
    inspection_no: '',
    inspected_at: '',
    maintenance_date: '',
    status: 'Completed',
    notes: '',
  })

  const submit = async () => {
    if (!form.transformer_id) return alert('Please select a transformer')
    setSaving(true)
    try {
      const payload = {
        transformer_id: form.transformer_id,
        inspection_no: form.inspection_no || null,
        inspected_at: form.inspected_at ? new Date(form.inspected_at).toISOString() : undefined,
        maintenance_date: form.maintenance_date ? new Date(form.maintenance_date).toISOString() : null,
        status: form.status,
        notes: form.notes || null,
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
    setForm({
      transformer_id: transformer?.id || '',
      inspection_no: row.inspectionNo === '—' ? '' : row.inspectionNo,
      inspected_at: '', // leave empty to avoid timezone surprises; user can set explicitly
      maintenance_date: row.maintenanceDate === '—' ? '' : '',
      status: row.status,
      notes: '',
    })
    setEditingId(id)
    setAddOpen(true)
  }

  const onDelete = async (id: string) => {
    if (!confirm('Delete this inspection?')) return
    try {
      await deleteInspection(id)
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
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-sans font-bold text-foreground">All Inspections</h1>
            <p className="text-muted-foreground font-serif">Browse and manage inspection records</p>
          </div>
          <Button className="button-primary" onClick={() => setAddOpen(true)}>
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
                <label className="text-sm text-muted-foreground font-serif">Transformer</label>
                <Select value={form.transformer_id} onValueChange={(v) => setForm((f) => ({ ...f, transformer_id: v }))}>
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
                <label className="text-sm text-muted-foreground font-serif">Inspection No</label>
                <Input className="font-serif mt-1" placeholder="e.g., 000123589" value={form.inspection_no}
                  onChange={(e) => setForm((f) => ({ ...f, inspection_no: e.target.value }))} />
              </div>

              <div>
                <label className="text-sm text-muted-foreground font-serif">Status</label>
                <Select value={form.status.toLowerCase()} onValueChange={(v) => setForm((f) => ({ ...f, status: (v === 'in progress' ? 'In Progress' : v === 'pending' ? 'Pending' : 'Completed') }))}>
                  <SelectTrigger className="font-serif mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in progress">In Progress</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground font-serif">Inspected At</label>
                <Input type="datetime-local" className="font-serif mt-1" value={form.inspected_at}
                  onChange={(e) => setForm((f) => ({ ...f, inspected_at: e.target.value }))} />
              </div>

              <div>
                <label className="text-sm text-muted-foreground font-serif">Maintenance Date</label>
                <Input type="datetime-local" className="font-serif mt-1" value={form.maintenance_date}
                  onChange={(e) => setForm((f) => ({ ...f, maintenance_date: e.target.value }))} />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-muted-foreground font-serif">Notes</label>
                <Textarea className="font-serif mt-1" rows={3} value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                <Button variant="outline" className="bg-transparent font-serif" onClick={() => { setAddOpen(false); setEditingId(null); resetForm() }}>Cancel</Button>
                <Button className="font-serif" onClick={submit} disabled={saving}>{saving ? 'Saving...' : (editingId ? 'Save Changes' : 'Save Inspection')}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
