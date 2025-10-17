/**
 * Feedback Database Setup Utility
 * 
 * This utility checks if the feedback_logs table exists and provides
 * setup instructions if it doesn't.
 */

import { createServerClient } from '@/lib/supabase/client'

export const FEEDBACK_TABLE_SQL = `
-- Create feedback_logs table
CREATE TABLE IF NOT EXISTS feedback_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id VARCHAR(255) NOT NULL,
  model_predicted_anomalies JSONB,
  final_accepted_annotations JSONB,
  annotator_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feedback_logs_image_id ON feedback_logs(image_id);
CREATE INDEX IF NOT EXISTS idx_feedback_logs_created_at ON feedback_logs(created_at DESC);
`

/**
 * Check if the feedback_logs table exists in the database
 */
export async function checkFeedbackTableExists(): Promise<{
  exists: boolean
  error?: string
}> {
  try {
    const supabase = createServerClient()
    
    // Try to query the table
    const { error } = await supabase
      .from('feedback_logs')
      .select('id')
      .limit(1)

    if (error) {
      // Check if error is due to table not existing
      if (error.message.includes('does not exist') || 
          error.message.includes('relation') ||
          error.code === '42P01') {
        return { exists: false }
      }
      return { exists: false, error: error.message }
    }

    return { exists: true }
  } catch (error) {
    console.error('Error checking feedback_logs table:', error)
    return { 
      exists: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Initialize the feedback logging system by checking if table exists
 * and providing setup instructions if needed
 */
export async function initializeFeedbackSystem(): Promise<{
  ready: boolean
  message: string
  setupInstructions?: string
}> {
  const { exists, error } = await checkFeedbackTableExists()

  if (exists) {
    return {
      ready: true,
      message: 'Feedback logging system is ready'
    }
  }

  const setupInstructions = `
⚠️ Feedback Logging Table Not Found

The 'feedback_logs' table doesn't exist in your Supabase database yet.

To set it up:

1. Go to your Supabase Dashboard (https://supabase.com/dashboard)
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy and paste this SQL:

${FEEDBACK_TABLE_SQL}

6. Click "Run" (or press Ctrl+Enter)
7. Verify the table appears in "Table Editor"

Alternatively, visit: http://localhost:3000/settings
(A setup section will be available there)
`

  return {
    ready: false,
    message: 'Feedback logging table needs to be created',
    setupInstructions
  }
}

/**
 * Seed sample feedback log (for testing)
 */
export async function seedSampleFeedback(): Promise<boolean> {
  try {
    const supabase = createServerClient()
    
    const sampleFeedback = {
      image_id: 'sample_img_' + Date.now(),
      model_predicted_anomalies: {
        detections: [
          {
            bbox: [100, 150, 200, 180],
            type: 'Point Overload',
            confidence: 0.85
          }
        ],
        label: 'Critical'
      },
      final_accepted_annotations: {
        detections: [
          {
            bbox: [105, 148, 195, 178],
            type: 'Point Overload (Verified)',
            confidence: 1.0
          }
        ],
        label: 'Critical'
      },
      annotator_metadata: {
        annotator_id: 'sample_user',
        annotator_name: 'Sample User',
        timestamp: new Date().toISOString(),
        note: 'This is a sample feedback log for testing'
      }
    }

    const { error } = await supabase
      .from('feedback_logs')
      .insert(sampleFeedback)

    if (error) {
      console.error('Error seeding sample feedback:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Exception seeding sample feedback:', error)
    return false
  }
}
