// Anomaly Detection API client for calling backend anomaly detection service

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080/api'

export interface AnomalyDetectionRequest {
  imageUrl: string
  inspectionId?: string
}

export interface AnomalyDetectionResponse {
  // Mapped response from backend
  originalImage: string     // Original image without annotations
  overlayImage: string      // Image with bounding boxes drawn
  heatmapImage: string      // Filtered/heatmap visualization
  maskImage: string         // Segmentation mask
  label: string             // Overall classification (e.g., "Normal", "Critical")
  detections: Detection[]   // Array of detected anomalies
}

export interface Detection {
  bbox: number[]     // [x, y, width, height]
  type: string       // Type of anomaly (e.g., "Point Overload (Faulty)")
  confidence: number // Confidence score from API (0-1 range)
}

/**
 * Detect anomalies in a thermal image by calling the backend anomaly detection endpoint
 * 
 * @param imageUrl - The URL of the thermal image to analyze
 * @param inspectionId - Optional inspection ID to update status to "In Progress"
 * @returns Promise with the anomaly detection results or null on error
 */
export async function detectAnomalies(imageUrl: string, inspectionId?: string): Promise<AnomalyDetectionResponse | null> {
  if (!imageUrl || imageUrl.trim() === '') {
    console.error('Image URL is required for anomaly detection')
    return null
  }

  try {
    console.log('🚀 [Anomaly API] Sending request to:', `${BACKEND_BASE_URL}/anomalies/detect`)
    console.log('📤 [Anomaly API] Request payload:', { imageUrl, inspectionId })
    
    const response = await fetch(`${BACKEND_BASE_URL}/anomalies/detect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl, inspectionId }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('❌ [Anomaly API] Detection failed:', response.status, errorData)
      throw new Error(errorData.message || `Failed to detect anomalies: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('✅ [Anomaly API] Response received:')
    console.log('  - Detections count:', data.detections?.length || 0)
    console.log('  - Label:', data.label)
    console.log('  - Full response:', data)
    return data
  } catch (error) {
    console.error('Error calling anomaly detection API:', error)
    // Return null on error for simpler error handling
    return null
  }
}

/**
 * Check the health status of the anomaly detection API
 * 
 * @returns Promise with the health status or null on error
 */
export async function checkAnomalyApiHealth(): Promise<any | null> {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/anomalies/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Health check failed:', response.status)
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error checking anomaly API health:', error)
    return null
  }
}

/**
 * Anomaly detection API operations
 */
export const anomalyApi = {
  /**
   * Detect anomalies in a thermal image
   */
  detect: detectAnomalies,

  /**
   * Check health status of the anomaly detection service
   */
  checkHealth: checkAnomalyApiHealth,
}

// Export as default
export default anomalyApi
