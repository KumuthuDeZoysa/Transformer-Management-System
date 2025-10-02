// Backend API client for Spring Boot integration

export interface CreateImageRequest {
  transformerId: string
  url?: string
  label?: string
  imageType: string // "baseline" or "maintenance"
  uploaderName: string
  environmentalCondition?: string // "sunny", "cloudy", "rainy"
  comments?: string
  inspectionId?: string
  capturedAt?: string
}
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080/api'

// Types matching the backend entities
export interface BackendTransformer {
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

export interface BackendImage {
  id: string
  url: string
  label: string | null
  imageType: string
  uploaderName: string | null
  environmentalCondition: string | null
  comments: string | null
  capturedAt: string
  createdAt: string
  transformerId: string
  transformerCode: string | null
  inspectionId: string | null
  inspectionNo: string | null
}

export interface BackendInspection {
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

// Helper function for making API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BACKEND_BASE_URL}${endpoint}`
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {
        // If JSON parsing fails, use the default message
      }
      throw new Error(errorMessage)
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return {} as T
    }

    return await response.json()
  } catch (error) {
    console.error(`API call failed for ${url}:`, error)
    throw error
  }
}

// Transformer API operations
export const transformerApi = {
  // Get all transformers
  async getAll(): Promise<BackendTransformer[]> {
    return apiCall<BackendTransformer[]>('/transformers')
  },

  // Get transformer by ID
  async getById(id: string): Promise<BackendTransformer> {
    return apiCall<BackendTransformer>(`/transformers/${id}`)
  },

  // Create new transformer
  async create(data: CreateTransformerRequest): Promise<BackendTransformer> {
    return apiCall<BackendTransformer>('/transformers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Update transformer
  async update(id: string, data: Partial<CreateTransformerRequest>): Promise<BackendTransformer> {
    return apiCall<BackendTransformer>(`/transformers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // Delete transformer
  async delete(id: string): Promise<void> {
    return apiCall<void>(`/transformers/${id}`, {
      method: 'DELETE',
    })
  },
}

// Image API operations
export const imageApi = {
  // Get all images
  async getAll(): Promise<BackendImage[]> {
    return apiCall<BackendImage[]>('/images')
  },

  // Get baseline image for transformer
  async getBaselineImage(transformerId: string): Promise<BackendImage | null> {
    try {
      return await apiCall<BackendImage>(`/images/baseline/${transformerId}`)
    } catch (error) {
      // Return null if no baseline image found (404)
      return null
    }
  },

  // Get images by transformer ID
  async getByTransformerId(transformerId: string): Promise<BackendImage[]> {
    return apiCall<BackendImage[]>(`/images?transformerId=${transformerId}`)
  },

  // Get images by transformer ID and image type
  async getByTransformerIdAndType(transformerId: string, imageType: string): Promise<BackendImage[]> {
    return apiCall<BackendImage[]>(`/images?transformerId=${transformerId}&imageType=${imageType}`)
  },

  // Get images by inspection ID
  async getByInspectionId(inspectionId: string): Promise<BackendImage[]> {
    return apiCall<BackendImage[]>(`/images?inspectionId=${inspectionId}`)
  },

  // Get images by image type
  async getByType(imageType: string): Promise<BackendImage[]> {
    return apiCall<BackendImage[]>(`/images?imageType=${imageType}`)
  },

  // Get image by ID
  async getById(id: string): Promise<BackendImage> {
    return apiCall<BackendImage>(`/images/${id}`)
  },

  // Create new image metadata
  async create(data: CreateImageRequest): Promise<BackendImage> {
    // Convert to backend format
    const backendData = {
      transformer: { id: data.transformerId },
      url: data.url,
      label: data.label || null,
      capturedAt: data.capturedAt || new Date().toISOString(),
    }
    
    return apiCall<BackendImage>('/images', {
      method: 'POST',
      body: JSON.stringify(backendData),
    })
  },

  // Update image
  async update(id: string, data: Partial<CreateImageRequest>): Promise<BackendImage> {
    const backendData: any = {}
    if (data.url) backendData.url = data.url
    if (data.label) backendData.label = data.label
    if (data.capturedAt) backendData.capturedAt = data.capturedAt
    if (data.transformerId) backendData.transformer = { id: data.transformerId }

    return apiCall<BackendImage>(`/images/${id}`, {
      method: 'PUT',
      body: JSON.stringify(backendData),
    })
  },

  // Delete image
  async delete(id: string): Promise<void> {
    return apiCall<void>(`/images/${id}`, {
      method: 'DELETE',
    })
  },

  // Upload image file
  async upload(file: File, transformerId: string, label?: string): Promise<{ url: string, image: BackendImage, message: string }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('transformer_id', transformerId)
    if (label) {
      formData.append('label', label)
    }

    const response = await fetch(`${BACKEND_BASE_URL}/images/upload`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    return response.json()
  },
}

// Inspection API operations
export const inspectionApi = {
  // Get all inspections
  async getAll(): Promise<BackendInspection[]> {
    return apiCall<BackendInspection[]>('/inspections')
  },

  // Get inspections by transformer ID
  async getByTransformerId(transformerId: string): Promise<BackendInspection[]> {
    return apiCall<BackendInspection[]>(`/inspections?transformerId=${transformerId}`)
  },

  // Get inspection by ID
  async getById(id: string): Promise<BackendInspection> {
    return apiCall<BackendInspection>(`/inspections/${id}`)
  },

  // Create new inspection
  async create(data: CreateInspectionRequest): Promise<BackendInspection> {
    // Convert to backend format
    const backendData = {
      transformer: { id: data.transformerId },
      inspectionNo: data.inspectionNo || null,
      inspectedAt: data.inspectedAt || new Date().toISOString(),
      maintenanceDate: data.maintenanceDate || null,
      status: data.status || 'Pending',
      notes: data.notes || null,
    }
    
    return apiCall<BackendInspection>('/inspections', {
      method: 'POST',
      body: JSON.stringify(backendData),
    })
  },

  // Update inspection
  async update(id: string, data: Partial<CreateInspectionRequest>): Promise<BackendInspection> {
    const backendData: any = {}
    if (data.inspectionNo) backendData.inspectionNo = data.inspectionNo
    if (data.inspectedAt) backendData.inspectedAt = data.inspectedAt
    if (data.maintenanceDate) backendData.maintenanceDate = data.maintenanceDate
    if (data.status) backendData.status = data.status
    if (data.notes) backendData.notes = data.notes
    if (data.transformerId) backendData.transformer = { id: data.transformerId }

    return apiCall<BackendInspection>(`/inspections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(backendData),
    })
  },

  // Delete inspection
  async delete(id: string): Promise<void> {
    return apiCall<void>(`/inspections/${id}`, {
      method: 'DELETE',
    })
  },
}

// File upload helper (for direct backend image uploads)
export const uploadApi = {
  // Upload image file directly to Spring Boot backend
  async uploadImageToBackend(
    file: File,
    transformerId: string,
    imageType: 'baseline' | 'maintenance',
    uploaderName: string,
    environmentalCondition?: 'sunny' | 'cloudy' | 'rainy',
    comments?: string,
    inspectionId?: string,
    label?: string
  ): Promise<{ url: string; image: BackendImage; message: string }> {
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('transformer_id', transformerId)
    formData.append('image_type', imageType)
    formData.append('uploader_name', uploaderName)
    
    if (environmentalCondition) formData.append('environmental_condition', environmentalCondition)
    if (comments) formData.append('comments', comments)
    if (inspectionId) formData.append('inspection_id', inspectionId)
    if (label) formData.append('label', label)
    
    // Call Spring Boot backend directly
    const response = await fetch(`${BACKEND_BASE_URL}/images/upload`, {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Upload failed: ${response.statusText}`)
    }
    
    return response.json()
  },

  // Legacy method for compatibility (uses Next.js API route)
  async uploadImage(
    file: File,
    transformerId: string,
    metadata: {
      imageType?: 'baseline' | 'maintenance'
      uploaderName?: string
      environmentalCondition?: 'sunny' | 'cloudy' | 'rainy'
      comments?: string
      inspectionId?: string
    } = {}
  ): Promise<{ url: string; image: any }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('transformer_id', transformerId)
    
    if (metadata.imageType) formData.append('image_type', metadata.imageType)
    if (metadata.uploaderName) formData.append('uploader_name', metadata.uploaderName)
    if (metadata.environmentalCondition) formData.append('environmental_condition', metadata.environmentalCondition)
    if (metadata.comments) formData.append('comments', metadata.comments)
    if (metadata.inspectionId) formData.append('inspection_id', metadata.inspectionId)
    
    const uploadResponse = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    })
    
    if (!uploadResponse.ok) {
      throw new Error('Image upload failed')
    }
    
    return uploadResponse.json()
  },
}

// Health check function
export const healthCheck = {
  async checkBackendStatus(): Promise<{ status: 'healthy' | 'unhealthy'; message: string }> {
    try {
      // Try to fetch transformers as a health check
      await apiCall<any>('/transformers')
      return { status: 'healthy', message: 'Backend is running and accessible' }
    } catch (error) {
      return { 
        status: 'unhealthy', 
        message: `Backend is not accessible: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  },
}

// Export default object with all APIs
export default {
  transformers: transformerApi,
  images: imageApi,
  inspections: inspectionApi,
  upload: uploadApi,
  health: healthCheck,
}