// Feedback Logging API for storing user feedback on AI-generated anomaly detections
import { createServerClient, createBrowserClient } from '@/lib/supabase/client'
import type { FeedbackLog, CreateFeedbackLogRequest, ModelPredictions, FinalAnnotations, AnnotatorMetadata } from './types'

/**
 * Save feedback log to the database
 * 
 * @param imageId - Unique identifier of the image
 * @param modelPredictions - Model's detected anomalies with full bbox and metadata
 * @param finalAnnotations - User-modified annotations with full bbox and metadata
 * @param annotatorMetadata - Metadata about the annotator (ID, username, timestamp, etc.)
 * @returns Promise with the created feedback log or null on error
 */
export async function saveFeedbackLog(
  imageId: string,
  modelPredictions: ModelPredictions,
  finalAnnotations: FinalAnnotations,
  annotatorMetadata?: AnnotatorMetadata
): Promise<FeedbackLog | null> {
  try {
    const supabase = createServerClient()
    
    const feedbackData = {
      image_id: imageId,
      model_predicted_anomalies: modelPredictions,
      final_accepted_annotations: finalAnnotations,
      annotator_metadata: annotatorMetadata || {},
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('feedback_logs')
      .insert(feedbackData)
      .select('*')
      .single()

    if (error) {
      console.error('Error saving feedback log:', error)
      return null
    }

    return data as FeedbackLog
  } catch (error) {
    console.error('Exception saving feedback log:', error)
    return null
  }
}

/**
 * Retrieve all feedback logs from the database
 * 
 * @param limit - Maximum number of records to retrieve (default: 1000)
 * @param offset - Number of records to skip (default: 0)
 * @returns Promise with array of feedback logs or null on error
 */
export async function getAllFeedbackLogs(
  limit: number = 1000,
  offset: number = 0
): Promise<FeedbackLog[] | null> {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('feedback_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching feedback logs:', error)
      return null
    }

    return data as FeedbackLog[]
  } catch (error) {
    console.error('Exception fetching feedback logs:', error)
    return null
  }
}

/**
 * Get feedback logs for a specific image
 * 
 * @param imageId - The image ID to filter by
 * @returns Promise with array of feedback logs or null on error
 */
export async function getFeedbackLogsByImageId(
  imageId: string
): Promise<FeedbackLog[] | null> {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('feedback_logs')
      .select('*')
      .eq('image_id', imageId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching feedback logs by image ID:', error)
      return null
    }

    return data as FeedbackLog[]
  } catch (error) {
    console.error('Exception fetching feedback logs by image ID:', error)
    return null
  }
}

/**
 * Delete a feedback log
 * 
 * @param id - The feedback log ID to delete
 * @returns Promise with success boolean
 */
export async function deleteFeedbackLog(id: string): Promise<boolean> {
  try {
    const supabase = createServerClient()

    const { error } = await supabase
      .from('feedback_logs')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting feedback log:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Exception deleting feedback log:', error)
    return false
  }
}

/**
 * Get count of feedback logs
 * 
 * @returns Promise with count or 0 on error
 */
export async function getFeedbackLogsCount(): Promise<number> {
  try {
    const supabase = createServerClient()

    const { count, error } = await supabase
      .from('feedback_logs')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('Error counting feedback logs:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Exception counting feedback logs:', error)
    return 0
  }
}
