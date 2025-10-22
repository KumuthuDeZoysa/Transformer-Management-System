// Annotation API client for interactive annotation and feedback

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080/api'

export interface AnnotationDTO {
  id?: string
  x: number
  y: number
  width: number
  height: number
  label: string
  confidence?: number
  severity?: 'Critical' | 'Warning' | 'Uncertain'
  action: 'added' | 'edited' | 'deleted' | 'confirmed'
  annotationType?: 'AI_GENERATED' | 'USER_CREATED' | 'USER_EDITED'
  notes?: string
  userId?: string
  timestamp?: string
  lastModified?: string
  modificationTypes?: string[]
  modificationDetails?: string
  isAI?: boolean
  originalDetectionId?: string
  imageId?: string
  transformerId?: string
}

export interface SaveAnnotationsRequest {
  imageId: string
  userId: string
  timestamp?: string
  annotations: AnnotationDTO[]
}

export interface SaveAnnotationsResponse {
  message: string
  count: number
  annotations: AnnotationDTO[]
}

/**
 * Save annotation updates to the backend
 * 
 * @param request - The save annotations request
 * @returns Promise with the save result
 */
export async function saveAnnotations(request: SaveAnnotationsRequest): Promise<SaveAnnotationsResponse | null> {
  try {
    console.log('📤 [Annotation API] Saving annotations:', request)
    
    const response = await fetch(`${BACKEND_BASE_URL}/annotations/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('❌ [Annotation API] Save failed:', response.status, errorData)
      throw new Error(errorData.error || `Failed to save annotations: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('✅ [Annotation API] Annotations saved:', data)
    return data
  } catch (error) {
    console.error('Error saving annotations:', error)
    return null
  }
}

/**
 * Get annotations for a specific inspection (uses new table)
 * 
 * @param imageId - The inspection ID
 * @returns Promise with the annotations list
 */
export async function getAnnotationsByImage(imageId: string): Promise<AnnotationDTO[] | null> {
  return getInspectionAnnotations(imageId)
}

/**
 * Get annotations for a specific anomaly detection
 * 
 * @param detectionId - The detection ID
 * @returns Promise with the annotations list
 */
export async function getAnnotationsByDetection(detectionId: string): Promise<AnnotationDTO[] | null> {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/annotations/detection/${detectionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Failed to fetch annotations:', response.status)
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching annotations:', error)
    return null
  }
}

/**
 * Delete an annotation
 * 
 * @param annotationId - The annotation ID to delete
 * @returns Promise with success status
 */
export async function deleteAnnotation(annotationId: string): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/annotations/${annotationId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Failed to delete annotation:', response.status)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting annotation:', error)
    return false
  }
}

/**
 * Save annotation updates in real-time with full metadata
 * Uses the new inspection_annotations table
 * 
 * @param imageId - The inspection ID
 * @param userId - The user ID making the changes
 * @param transformerId - The transformer ID (optional)
 * @param activeAnnotations - Currently active bounding boxes
 * @param deletedAnnotations - Deleted bounding boxes
 * @returns Promise with the save result
 */
export async function saveAnnotationsRealtime(
  imageId: string,
  userId: string,
  transformerId: string | undefined,
  activeAnnotations: any[],
  deletedAnnotations: any[]
): Promise<SaveAnnotationsResponse | null> {
  try {
    // Convert bounding boxes to AnnotationDTO format
    const annotations: AnnotationDTO[] = [
      ...activeAnnotations.map(box => ({
        id: box.id && !box.id.startsWith('user-') && !box.id.startsWith('ai-') ? box.id : undefined,
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
        label: box.label,
        confidence: box.confidence !== undefined ? box.confidence : 1.0,
        severity: box.severity,
        action: box.action as 'added' | 'edited' | 'deleted' | 'confirmed',
        annotationType: box.isAI ? 'AI_GENERATED' as const : 'USER_CREATED' as const,
        notes: box.notes,
        userId: box.userId || userId,
        timestamp: box.timestamp || new Date().toISOString(),
        lastModified: box.lastModified || new Date().toISOString(),
        modificationTypes: box.modificationTypes || ['created'],
        modificationDetails: box.modificationDetails,
        isAI: box.isAI,
        imageId: imageId,
        transformerId: transformerId
      })),
      ...deletedAnnotations.map(box => ({
        id: box.id && !box.id.startsWith('user-') && !box.id.startsWith('ai-') ? box.id : undefined,
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
        label: box.label,
        confidence: box.confidence !== undefined ? box.confidence : 1.0,
        severity: box.severity,
        action: 'deleted' as const,
        annotationType: box.isAI ? 'AI_GENERATED' as const : 'USER_CREATED' as const,
        notes: box.notes,
        userId: box.userId || userId,
        timestamp: box.timestamp || new Date().toISOString(),
        lastModified: box.lastModified || new Date().toISOString(),
        modificationTypes: box.modificationTypes || ['deleted'],
        modificationDetails: box.modificationDetails,
        isAI: box.isAI,
        imageId: imageId,
        transformerId: transformerId
      }))
    ]

    const request: SaveAnnotationsRequest = {
      imageId,
      userId,
      timestamp: new Date().toISOString(),
      annotations
    }

    console.log('📤 [Annotation API] Real-time save to inspection_annotations:', {
      inspectionId: imageId,
      userId,
      transformerId,
      activeCount: activeAnnotations.length,
      deletedCount: deletedAnnotations.length,
      totalAnnotations: annotations.length
    })

    // Use new endpoint
    const response = await fetch(`${BACKEND_BASE_URL}/inspection-annotations/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      console.error('Failed to save annotations:', response.status)
      return null
    }

    const data = await response.json()
    console.log('✅ [Annotation API] Save successful:', data.message, '- Count:', data.count)
    return data
  } catch (error) {
    console.error('Error saving annotations in real-time:', error)
    return null
  }
}

/**
 * Get annotations for an inspection from the new table
 * 
 * @param inspectionId - The inspection ID
 * @returns Promise with the annotations list
 */
export async function getInspectionAnnotations(inspectionId: string): Promise<AnnotationDTO[] | null> {
  try {
    console.log('📥 [Annotation API] Fetching from inspection_annotations:', inspectionId)
    
    const response = await fetch(`${BACKEND_BASE_URL}/inspection-annotations/${inspectionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Failed to fetch annotations:', response.status)
      return null
    }

    const data = await response.json()
    console.log('✅ [Annotation API] Fetched', data.length, 'annotations')
    return data
  } catch (error) {
    console.error('Error fetching annotations:', error)
    return null
  }
}

/**
 * Annotation API operations
 */
export const annotationApi = {
  save: saveAnnotations,
  getByImage: getAnnotationsByImage,
  getByDetection: getAnnotationsByDetection,
  delete: deleteAnnotation,
}
