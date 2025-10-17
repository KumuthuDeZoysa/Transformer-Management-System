-- Migration: Create feedback_logs table for storing user feedback on AI-generated anomaly detections
-- Date: 2025-10-17
-- Description: This table stores feedback logs to help improve the anomaly detection model

-- Create feedback_logs table
CREATE TABLE IF NOT EXISTS feedback_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id VARCHAR(255) NOT NULL,
  model_predicted_anomalies JSONB,
  final_accepted_annotations JSONB,
  annotator_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_feedback_logs_image_id ON feedback_logs(image_id);
CREATE INDEX IF NOT EXISTS idx_feedback_logs_created_at ON feedback_logs(created_at DESC);

-- Add comments to document the table and columns
COMMENT ON TABLE feedback_logs IS 'Stores user feedback on AI-generated anomaly detections for model improvement';
COMMENT ON COLUMN feedback_logs.id IS 'Primary key, auto-generated UUID';
COMMENT ON COLUMN feedback_logs.image_id IS 'Unique identifier of the thermal image';
COMMENT ON COLUMN feedback_logs.model_predicted_anomalies IS 'JSON object containing the model''s predicted anomalies';
COMMENT ON COLUMN feedback_logs.final_accepted_annotations IS 'JSON object containing the user-modified/accepted annotations';
COMMENT ON COLUMN feedback_logs.annotator_metadata IS 'JSON object containing annotator information (ID, username, timestamp, etc.)';
COMMENT ON COLUMN feedback_logs.created_at IS 'Timestamp when the feedback log was created';

-- Optional: Enable Row Level Security (RLS)
-- ALTER TABLE feedback_logs ENABLE ROW LEVEL SECURITY;

-- Optional: Create policy for authenticated users to insert feedback
-- CREATE POLICY "Users can insert feedback logs" ON feedback_logs
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (true);

-- Optional: Create policy for authenticated users to read feedback
-- CREATE POLICY "Users can read feedback logs" ON feedback_logs
--   FOR SELECT
--   TO authenticated
--   USING (true);
