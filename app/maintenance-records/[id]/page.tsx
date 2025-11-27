"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { maintenanceRecordApi } from '@/lib/maintenance-record-api'
import backendApi from '@/lib/backend-api'
import { MaintenanceRecordForm } from '@/components/forms/maintenance-record-form'
import { MaintenanceRecord } from '@/lib/types'

export default function MaintenanceRecordDetailPage() {
  const params = useParams()
  const router = useRouter()
  const recordId = params.id as string

  const [record, setRecord] = useState<MaintenanceRecord | null>(null)
  const [transformer, setTransformer] = useState<any | null>(null)
  const [inspection, setInspection] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        console.log('🔄 Loading maintenance record:', recordId)
        
        const healthCheck = await backendApi.health.checkBackendStatus()
        if (healthCheck.status === 'unhealthy') {
          console.warn('⚠️ Backend is not accessible')
          router.push('/maintenance-records')
          return
        }
        
        const currentRecord = await maintenanceRecordApi.getById(recordId)
        if (!currentRecord) {
          router.push('/maintenance-records')
          return
        }
        
        setRecord(currentRecord)
        
        // Load related data
        if (currentRecord.transformer?.id) {
          try {
            const transformers = await backendApi.transformers.getAll()
            const t = transformers.find((tr: any) => tr.id === currentRecord.transformer.id)
            if (t) setTransformer(t)
          } catch (error) {
            console.error('Failed to load transformer:', error)
          }
        }
        
        if (currentRecord.inspection?.id) {
          try {
            const inspections = await backendApi.inspections.getAll()
            const i = inspections.find((insp: any) => insp.id === currentRecord.inspection.id)
            if (i) setInspection(i)
          } catch (error) {
            console.error('Failed to load inspection:', error)
          }
        }
      } catch (e: any) {
        console.error('❌ Failed to load maintenance record:', e)
        alert(e.message || 'Failed to load maintenance record')
        router.push('/maintenance-records')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [recordId, router])

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground font-serif">Loading maintenance record...</div>
        </div>
      </MainLayout>
    )
  }

  if (!record) {
    return null
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/maintenance-records">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Records
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-sans font-bold text-foreground">Maintenance Record</h1>
            <p className="text-muted-foreground font-serif">
              Record ID: {record.id.substring(0, 8)}...
            </p>
          </div>
        </div>

        <MaintenanceRecordForm
          inspectionId={record.inspection.id}
          transformerCode={transformer?.code || 'Unknown'}
          transformerType={transformer?.type}
          transformerCapacity={transformer?.capacity}
          transformerRegion={transformer?.region}
          transformerLocation={transformer?.location}
          inspectionNo={inspection?.inspectionNo}
          inspectedAt={inspection?.inspectedAt}
          existingRecord={record}
          onSave={(updatedRecord) => {
            setRecord(updatedRecord)
            console.log('✅ Maintenance record updated:', updatedRecord.id)
          }}
        />
      </div>
    </MainLayout>
  )
}
