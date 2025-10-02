// Unified types for the Transformer Management System
// This file consolidates all interfaces to avoid duplication

export interface Transformer {
  id: string
  code: string | null
  poleNo: string | null
  region: string | null
  type: 'Distribution' | 'Power' | 'Bulk' | null
  capacity: string | null
  location: string | null
  status: 'Normal' | 'Warning' | 'Critical'
  lastInspection: string | null
  createdAt: string
  updatedAt: string
}

export interface ThermalImage {
  id: string
  url: string
  label: string | null
  imageType: 'baseline' | 'maintenance'
  uploaderName: string | null
  environmentalCondition: 'sunny' | 'cloudy' | 'rainy' | null
  comments: string | null
  capturedAt: string
  createdAt: string
  transformerId: string
  transformerCode: string | null
  inspectionId: string | null
  inspectionNo: string | null
  branch?: string
}

export interface Inspection {
  id: string
  transformer: { id: string }
  inspectionNo: string | null
  inspectedAt: string
  maintenanceDate: string | null
  status: 'In Progress' | 'Pending' | 'Completed'
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface ImageUpload {
  id: string
  transformerId: string
  fileName: string
  imageType: 'baseline' | 'maintenance'
  uploaderName: string
  uploadDateTime: string
  comments?: string
  environmentalCondition?: 'sunny' | 'cloudy' | 'rainy'
  branch?: string
}

export interface CreateTransformerRequest {
  code?: string
  poleNo?: string
  region?: string
  type?: 'Distribution' | 'Power' | 'Bulk'
  capacity?: string
  location?: string
  status?: 'Normal' | 'Warning' | 'Critical'
}

export interface CreateInspectionRequest {
  transformerId: string
  inspectionNo?: string
  inspectedAt?: string
  maintenanceDate?: string
  status?: 'In Progress' | 'Pending' | 'Completed'
  notes?: string
}

export interface CreateImageRequest {
  transformerId: string
  url?: string
  label?: string
  imageType: 'baseline' | 'maintenance'
  uploaderName: string
  environmentalCondition?: 'sunny' | 'cloudy' | 'rainy'
  comments?: string
  inspectionId?: string
  capturedAt?: string
  branch?: string
}

export interface DashboardStats {
  totalTransformers: number
  operationalTransformers: number
  pendingInspections: number
  criticalAlerts: number
  inspectionsToday: number
  maintenanceCompleted: number
  statusDistribution: {
    normal: number
    warning: number
    critical: number
  }
}

export interface ApiResponse<T> {
  data: T
  message?: string
  error?: string
}

export interface LoadingState {
  loading: boolean
  error: string | null
}