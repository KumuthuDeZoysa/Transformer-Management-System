-- Migration: Create feedback_logs table for storing user feedback on AI-generated anomaly detections
-- Date: 2025-10-17

CREATE TABLE IF NOT EXISTS feedback_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id VARCHAR(255) NOT NULL,
  model_predicted_anomalies JSONB,
  final_accepted_annotations JSONB,
  annotator_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_feedback_image_id ON feedback_logs(image_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback_logs(created_at DESC);

COMMENT ON TABLE feedback_logs IS 'Stores user feedback comparing model predictions and final accepted annotations for images';
COMMENT ON COLUMN feedback_logs.model_predicted_anomalies IS 'JSONB column storing model predictions';
COMMENT ON COLUMN feedback_logs.final_accepted_annotations IS 'JSONB column storing user-accepted annotations';
COMMENT ON COLUMN feedback_logs.annotator_metadata IS 'JSONB column storing annotator metadata (id, name, timestamp)';

-- Optional RLS/policies can be added later
