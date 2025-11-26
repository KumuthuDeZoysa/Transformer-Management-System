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

// Feedback logging types for model improvement
export interface DetectionAnnotation {
  id?: string
  x: number
  y: number
  width: number
  height: number
  label: string
  type?: string  // Error type (e.g., "Point Overload", "Thermal Hotspot")
  confidence?: number
  severity?: 'Critical' | 'Warning' | 'Uncertain'
  action?: 'added' | 'edited' | 'deleted' | 'confirmed'
  annotationType?: 'AI_GENERATED' | 'USER_CREATED' | 'USER_EDITED'
  isAI?: boolean
  notes?: string
  timestamp?: string
  color?: string
  modificationTypes?: string[]
  modificationDetails?: string
}

export interface ModelPredictions {
  detections: DetectionAnnotation[]
  label?: string  // Overall classification (e.g., "Normal", "Critical")
  confidence?: number
  detectionCount?: number
  metadata?: {
    modelVersion?: string
    processingTime?: number
    imageUrl?: string
    [key: string]: any
  }
}

export interface FinalAnnotations {
  detections: DetectionAnnotation[]
  label?: string
  confidence?: number
  detectionCount?: number
  userModifications?: {
    added?: number
    edited?: number
    deleted?: number
    confirmed?: number
  }
  metadata?: {
    totalChanges?: number
    timeSpentSeconds?: number
    [key: string]: any
  }
}

export interface AnnotatorMetadata {
  annotator_id?: string
  annotator_name?: string
  user_id?: string
  username?: string
  session_id?: string
  timestamp?: string
  changes_made?: number
  time_spent_seconds?: number
  notes?: string
  [key: string]: any
}

export interface FeedbackLog {
  id: string
  image_id: string
  model_predicted_anomalies: ModelPredictions | null
  final_accepted_annotations: FinalAnnotations | null
  annotator_metadata: AnnotatorMetadata | null
  created_at: string
}

export interface CreateFeedbackLogRequest {
  image_id: string
  model_predicted_anomalies: ModelPredictions
  final_accepted_annotations: FinalAnnotations
  annotator_metadata?: AnnotatorMetadata
}

// Phase 4: Maintenance Record types
export interface MaintenanceRecord {
  id: string
  inspection: { id: string }
  transformer: { id: string }
  inspectorName: string | null
  transformerStatus: 'OK' | 'Needs Maintenance' | 'Urgent Attention' | null
  voltageReading: string | null
  currentReading: string | null
  powerFactor: string | null
  temperature: string | null
  recommendedAction: string | null
  additionalRemarks: string | null
  completionDate: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateMaintenanceRecordRequest {
  inspectionId: string
  inspectorName?: string
  transformerStatus?: 'OK' | 'Needs Maintenance' | 'Urgent Attention'
  voltageReading?: string
  currentReading?: string
  powerFactor?: string
  temperature?: string
  recommendedAction?: string
  additionalRemarks?: string
  completionDate?: string
}

export interface UpdateMaintenanceRecordRequest {
  inspectorName?: string
  transformerStatus?: 'OK' | 'Needs Maintenance' | 'Urgent Attention'
  voltageReading?: string
  currentReading?: string
  powerFactor?: string
  temperature?: string
  recommendedAction?: string
  additionalRemarks?: string
  completionDate?: string
}