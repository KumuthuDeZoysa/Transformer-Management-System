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
  action: 'added' | 'edited' | 'deleted' | 'confirmed'
  annotationType?: 'AI_GENERATED' | 'USER_CREATED' | 'USER_EDITED'
  notes?: string
  userId?: string
  timestamp?: string
  originalDetectionId?: string
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
 * Get annotations for a specific image
 * 
 * @param imageId - The image ID
 * @returns Promise with the annotations list
 */
export async function getAnnotationsByImage(imageId: string): Promise<AnnotationDTO[] | null> {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/annotations/image/${imageId}`, {
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
 * Annotation API operations
 */
export const annotationApi = {
  save: saveAnnotations,
  getByImage: getAnnotationsByImage,
  getByDetection: getAnnotationsByDetection,
  delete: deleteAnnotation,
}
