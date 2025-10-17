/**
 * Example React Hook for Feedback Logging
 * 
 * This hook provides an easy way to integrate feedback logging
 * into annotation/review components
 */

import { useState, useCallback } from 'react'
import type { CreateFeedbackLogRequest, ModelPredictions, FinalAnnotations, AnnotatorMetadata } from '@/lib/types'

interface UseFeedbackLogOptions {
  onSuccess?: (feedbackId: string) => void
  onError?: (error: string) => void
}

interface FeedbackLogState {
  loading: boolean
  error: string | null
  success: boolean
}

export function useFeedbackLog(options?: UseFeedbackLogOptions) {
  const [state, setState] = useState<FeedbackLogState>({
    loading: false,
    error: null,
    success: false
  })

  /**
   * Submit feedback log to the API
   */
  const submitFeedback = useCallback(async (
    imageId: string,
    modelPredictions: ModelPredictions,
    finalAnnotations: FinalAnnotations,
    annotatorMetadata?: AnnotatorMetadata
  ) => {
    setState({ loading: true, error: null, success: false })

    try {
      const payload: CreateFeedbackLogRequest = {
        image_id: imageId,
        model_predicted_anomalies: modelPredictions,
        final_accepted_annotations: finalAnnotations,
        annotator_metadata: annotatorMetadata
      }

      const response = await fetch('/api/feedback/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback')
      }

      setState({ loading: false, error: null, success: true })
      
      if (options?.onSuccess) {
        options.onSuccess(data.data.id)
      }

      return data.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setState({ loading: false, error: errorMessage, success: false })
      
      if (options?.onError) {
        options.onError(errorMessage)
      }

      return null
    }
  }, [options])

  /**
   * Reset the state
   */
  const reset = useCallback(() => {
    setState({ loading: false, error: null, success: false })
  }, [])

  return {
    submitFeedback,
    reset,
    ...state
  }
}

/**
 * Example usage in an annotation component:
 * 
 * ```tsx
 * import { useFeedbackLog } from '@/hooks/use-feedback-log'
 * 
 * export function AnnotationEditor() {
 *   const [modelPredictions, setModelPredictions] = useState(null)
 *   const [finalAnnotations, setFinalAnnotations] = useState(null)
 *   const { submitFeedback, loading, error, success } = useFeedbackLog({
 *     onSuccess: (id) => toast.success('Feedback saved!'),
 *     onError: (error) => toast.error(error)
 *   })
 * 
 *   const handleDetectAnomalies = async () => {
 *     // Call anomaly detection API
 *     const predictions = await detectAnomalies(imageUrl)
 *     setModelPredictions(predictions)
 *     setFinalAnnotations(predictions) // Initialize with model predictions
 *   }
 * 
 *   const handleSaveAnnotations = async () => {
 *     // Save annotations to database
 *     await saveAnnotations(finalAnnotations)
 *     
 *     // Log feedback for model improvement
 *     await submitFeedback(
 *       image.id,
 *       modelPredictions,
 *       finalAnnotations,
 *       {
 *         annotator_id: currentUser.id,
 *         annotator_name: currentUser.name,
 *         timestamp: new Date().toISOString(),
 *         changes_made: calculateChanges(modelPredictions, finalAnnotations)
 *       }
 *     )
 *   }
 * 
 *   return (
 *     <div>
 *       <button onClick={handleDetectAnomalies}>Detect Anomalies</button>
 *       <AnnotationCanvas 
 *         predictions={finalAnnotations}
 *         onChange={setFinalAnnotations}
 *       />
 *       <button onClick={handleSaveAnnotations} disabled={loading}>
 *         {loading ? 'Saving...' : 'Save Annotations'}
 *       </button>
 *       {error && <p className="error">{error}</p>}
 *       {success && <p className="success">Feedback logged successfully!</p>}
 *     </div>
 *   )
 * }
 * ```
 */
