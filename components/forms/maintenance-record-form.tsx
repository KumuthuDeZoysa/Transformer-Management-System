"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Save, Printer, FileDown, CheckCircle } from 'lucide-react'
import { MaintenanceRecord, CreateMaintenanceRecordRequest, UpdateMaintenanceRecordRequest } from '@/lib/types'
import { maintenanceRecordApi } from '@/lib/maintenance-record-api'

interface Detection {
  id: string
  label: string
  confidence?: number
  severity?: 'Critical' | 'Warning' | 'Uncertain'
  x: number
  y: number
  width: number
  height: number
}

interface MaintenanceRecordFormProps {
  inspectionId: string
  transformerCode: string
  transformerType?: string
  transformerCapacity?: string
  transformerRegion?: string
  transformerLocation?: string
  inspectionNo?: string
  inspectedAt?: string
  anomalySummary?: {
    totalAnomalies: number
    criticalCount: number
    warningCount: number
    uncertainCount: number
  }
  thermalImageUrl?: string
  detections?: Detection[]
  onSave?: (record: MaintenanceRecord) => void
  existingRecord?: MaintenanceRecord | null
}

export function MaintenanceRecordForm({
  inspectionId,
  transformerCode,
  transformerType,
  transformerCapacity,
  transformerRegion,
  transformerLocation,
  inspectionNo,
  inspectedAt,
  anomalySummary,
  thermalImageUrl,
  detections,
  onSave,
  existingRecord,
}: MaintenanceRecordFormProps) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    inspectorName: '',
    transformerStatus: '' as 'OK' | 'Needs Maintenance' | 'Urgent Attention' | '',
    voltageReading: '',
    currentReading: '',
    powerFactor: '',
    temperature: '',
    recommendedAction: '',
    additionalRemarks: '',
    completionDate: '',
  })

  // Load existing record if available
  useEffect(() => {
    if (existingRecord) {
      setForm({
        inspectorName: existingRecord.inspectorName || '',
        transformerStatus: existingRecord.transformerStatus || '',
        voltageReading: existingRecord.voltageReading || '',
        currentReading: existingRecord.currentReading || '',
        powerFactor: existingRecord.powerFactor || '',
        temperature: existingRecord.temperature || '',
        recommendedAction: existingRecord.recommendedAction || '',
        additionalRemarks: existingRecord.additionalRemarks || '',
        completionDate: existingRecord.completionDate 
          ? new Date(existingRecord.completionDate).toISOString().split('T')[0] 
          : '',
      })
      setSaved(true)
    }
  }, [existingRecord])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const data: CreateMaintenanceRecordRequest | UpdateMaintenanceRecordRequest = {
        ...(existingRecord ? {} : { inspectionId }),
        inspectorName: form.inspectorName || undefined,
        transformerStatus: form.transformerStatus || undefined,
        voltageReading: form.voltageReading || undefined,
        currentReading: form.currentReading || undefined,
        powerFactor: form.powerFactor || undefined,
        temperature: form.temperature || undefined,
        recommendedAction: form.recommendedAction || undefined,
        additionalRemarks: form.additionalRemarks || undefined,
        completionDate: form.completionDate ? new Date(form.completionDate).toISOString() : undefined,
      }

      let record: MaintenanceRecord
      if (existingRecord) {
        record = await maintenanceRecordApi.update(existingRecord.id, data)
      } else {
        record = await maintenanceRecordApi.create(data as CreateMaintenanceRecordRequest)
      }

      setSaved(true)
      if (onSave) {
        onSave(record)
      }
    } catch (error: any) {
      alert(error.message || 'Failed to save maintenance record')
    } finally {
      setSaving(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const getStatusBadgeVariant = (status: string) => {
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

  return (
    <div className="space-y-6 print-maintenance-record">
      {/* Header Section - Print Header */}
      <div className="print-header">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold font-sans">Thermal Image Inspection Form</h1>
          <p className="text-sm text-muted-foreground font-serif">Transformer Maintenance Record Sheet</p>
        </div>
      </div>

      {/* Transformer Information Card */}
      <Card className="print-section">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-sans">Transformer Information</CardTitle>
              <CardDescription className="font-serif">Transformer ID: {transformerCode}</CardDescription>
            </div>
            {form.transformerStatus && (
              <Badge variant={getStatusBadgeVariant(form.transformerStatus)}>
                {form.transformerStatus}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground font-serif">Transformer No.</div>
              <div className="font-medium font-sans">{transformerCode}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground font-serif">Type</div>
              <div className="font-medium font-sans">{transformerType || '—'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground font-serif">Capacity</div>
              <div className="font-medium font-sans">{transformerCapacity || '—'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground font-serif">Region</div>
              <div className="font-medium font-sans">{transformerRegion || '—'}</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-muted-foreground font-serif">Location</div>
            <div className="font-medium font-sans">{transformerLocation || '—'}</div>
          </div>
        </CardContent>
      </Card>

      {/* Inspection Details Card */}
      <Card className="print-section">
        <CardHeader>
          <CardTitle className="font-sans">Inspection Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground font-serif">Inspection No.</div>
              <div className="font-medium font-sans">{inspectionNo || '—'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground font-serif">Inspection Date</div>
              <div className="font-medium font-sans">
                {inspectedAt ? new Date(inspectedAt).toLocaleString() : '—'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thermal Image and Anomaly Summary - Side by Side */}
      {(thermalImageUrl || anomalySummary) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print-section">
          {/* Thermal Image */}
          {thermalImageUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="font-sans text-sm">Thermal Image with Annotations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden border">
                  <img
                    src={thermalImageUrl}
                    alt="Thermal image with anomaly markers"
                    className="w-full h-full object-contain"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Anomaly Summary */}
          {anomalySummary && (
            <Card>
              <CardHeader>
                <CardTitle className="font-sans text-sm">Detected Anomalies Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-serif">Total Anomalies</span>
                    <Badge variant="outline">{anomalySummary.totalAnomalies}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-serif text-red-600">Critical</span>
                    <Badge variant="destructive">{anomalySummary.criticalCount}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-serif text-amber-600">Warning</span>
                    <Badge variant="secondary">{anomalySummary.warningCount}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-serif text-blue-600">Uncertain</span>
                    <Badge variant="outline">{anomalySummary.uncertainCount}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Detailed Anomaly Detections Table */}
      {detections && detections.length > 0 && (
        <Card className="print-section">
          <CardHeader>
            <CardTitle className="font-sans">Anomaly Detection Details</CardTitle>
            <CardDescription className="font-serif">
              Detailed breakdown of each detected anomaly with confidence scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-sans font-semibold">#</th>
                    <th className="text-left p-2 font-sans font-semibold">Anomaly Type</th>
                    <th className="text-left p-2 font-sans font-semibold">Severity</th>
                    <th className="text-left p-2 font-sans font-semibold">Confidence</th>
                    <th className="text-left p-2 font-sans font-semibold">Location (x, y)</th>
                  </tr>
                </thead>
                <tbody>
                  {detections.map((detection, index) => (
                    <tr key={detection.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-serif">{index + 1}</td>
                      <td className="p-2 font-serif">{detection.label}</td>
                      <td className="p-2">
                        <Badge 
                          variant={
                            detection.severity === 'Critical' ? 'destructive' :
                            detection.severity === 'Warning' ? 'secondary' : 'outline'
                          }
                          className="text-xs"
                        >
                          {detection.severity || 'Unknown'}
                        </Badge>
                      </td>
                      <td className="p-2 font-serif">
                        {detection.confidence !== undefined 
                          ? `${(detection.confidence * 100).toFixed(1)}%` 
                          : 'N/A'}
                      </td>
                      <td className="p-2 font-mono text-xs">
                        ({Math.round(detection.x)}, {Math.round(detection.y)})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Editable Engineer Input Section */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="print-section">
          <CardHeader>
            <CardTitle className="font-sans">Engineer Input</CardTitle>
            <CardDescription className="font-serif no-print">
              Fill in the inspection and maintenance details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Inspector Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="inspectorName" className="font-serif">Inspector Name *</Label>
                <Input
                  id="inspectorName"
                  value={form.inspectorName}
                  onChange={(e) => setForm({ ...form, inspectorName: e.target.value })}
                  placeholder="Enter inspector name"
                  className="font-serif mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="transformerStatus" className="font-serif">Transformer Status *</Label>
                <Select
                  value={form.transformerStatus}
                  onValueChange={(value) => setForm({ ...form, transformerStatus: value as any })}
                  required
                >
                  <SelectTrigger className="font-serif mt-1">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OK">OK</SelectItem>
                    <SelectItem value="Needs Maintenance">Needs Maintenance</SelectItem>
                    <SelectItem value="Urgent Attention">Urgent Attention</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Electrical Readings */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="voltageReading" className="font-serif">Voltage (V)</Label>
                <Input
                  id="voltageReading"
                  value={form.voltageReading}
                  onChange={(e) => setForm({ ...form, voltageReading: e.target.value })}
                  placeholder="e.g. 11kV"
                  className="font-serif mt-1"
                />
              </div>
              <div>
                <Label htmlFor="currentReading" className="font-serif">Current (A)</Label>
                <Input
                  id="currentReading"
                  value={form.currentReading}
                  onChange={(e) => setForm({ ...form, currentReading: e.target.value })}
                  placeholder="e.g. 150A"
                  className="font-serif mt-1"
                />
              </div>
              <div>
                <Label htmlFor="powerFactor" className="font-serif">Power Factor</Label>
                <Input
                  id="powerFactor"
                  value={form.powerFactor}
                  onChange={(e) => setForm({ ...form, powerFactor: e.target.value })}
                  placeholder="e.g. 0.95"
                  className="font-serif mt-1"
                />
              </div>
              <div>
                <Label htmlFor="temperature" className="font-serif">Temperature (°C)</Label>
                <Input
                  id="temperature"
                  value={form.temperature}
                  onChange={(e) => setForm({ ...form, temperature: e.target.value })}
                  placeholder="e.g. 85°C"
                  className="font-serif mt-1"
                />
              </div>
            </div>

            {/* Completion Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="completionDate" className="font-serif">Completion Date</Label>
                <Input
                  id="completionDate"
                  type="date"
                  value={form.completionDate}
                  onChange={(e) => setForm({ ...form, completionDate: e.target.value })}
                  className="font-serif mt-1"
                />
              </div>
            </div>

            {/* Recommended Action */}
            <div>
              <Label htmlFor="recommendedAction" className="font-serif">Recommended Action</Label>
              <Textarea
                id="recommendedAction"
                value={form.recommendedAction}
                onChange={(e) => setForm({ ...form, recommendedAction: e.target.value })}
                placeholder="Describe recommended corrective actions..."
                className="font-serif mt-1 resize-none"
                rows={4}
              />
            </div>

            {/* Additional Remarks */}
            <div>
              <Label htmlFor="additionalRemarks" className="font-serif">Additional Remarks</Label>
              <Textarea
                id="additionalRemarks"
                value={form.additionalRemarks}
                onChange={(e) => setForm({ ...form, additionalRemarks: e.target.value })}
                placeholder="Any additional observations or notes..."
                className="font-serif mt-1 resize-none"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons - Hide in print */}
        <div className="flex justify-end gap-3 no-print">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrint}
            className="font-serif"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button
            type="submit"
            disabled={saving || !form.inspectorName || !form.transformerStatus}
            className="font-serif"
          >
            {saving ? (
              <>Saving...</>
            ) : saved ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Record
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-maintenance-record,
          .print-maintenance-record * {
            visibility: visible;
          }
          .print-maintenance-record {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          .print-section {
            page-break-inside: avoid;
          }
          .print-header {
            margin-bottom: 2rem;
          }
        }
      `}</style>
    </div>
  )
}
