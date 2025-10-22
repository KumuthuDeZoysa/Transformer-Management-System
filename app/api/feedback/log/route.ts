import { NextRequest, NextResponse } from 'next/server'
import { saveFeedbackLog, getAllFeedbackLogs } from '@/lib/feedback-api'
import type { CreateFeedbackLogRequest, ModelPredictions, FinalAnnotations } from '@/lib/types'

export const dynamic = 'force-dynamic'

/**
 * POST /api/feedback/log
 * 
 * Stores user feedback on AI-generated anomaly detections
 * 
 * Request body:
 * {
 *   "image_id": "img_123",
 *   "model_predicted_anomalies": {
 *     "detections": [
 *       {
 *         "x": 100, "y": 150, "width": 200, "height": 180,
 *         "label": "Point Overload", "type": "Point Overload (Faulty)",
 *         "confidence": 0.85, "severity": "Critical", "isAI": true
 *       }
 *     ],
 *     "label": "Critical",
 *     "confidence": 0.89,
 *     "detectionCount": 2
 *   },
 *   "final_accepted_annotations": {
 *     "detections": [...],
 *     "label": "Critical",
 *     "userModifications": { "added": 0, "edited": 1, "deleted": 1, "confirmed": 0 }
 *   },
 *   "annotator_metadata": {
 *     "annotator_id": "user_123",
 *     "annotator_name": "John Doe",
 *     "timestamp": "2025-10-17T10:30:00Z"
 *   }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body: CreateFeedbackLogRequest = await req.json()

    // Validate required fields
    if (!body.image_id || typeof body.image_id !== 'string') {
      return NextResponse.json(
        { error: 'image_id is required and must be a string' },
        { status: 400 }
      )
    }

    if (!body.model_predicted_anomalies || typeof body.model_predicted_anomalies !== 'object') {
      return NextResponse.json(
        { error: 'model_predicted_anomalies is required and must be an object with detections array' },
        { status: 400 }
      )
    }

    if (!body.final_accepted_annotations || typeof body.final_accepted_annotations !== 'object') {
      return NextResponse.json(
        { error: 'final_accepted_annotations is required and must be an object with detections array' },
        { status: 400 }
      )
    }

    // Validate detections arrays exist
    const modelPredictions = body.model_predicted_anomalies as ModelPredictions
    const finalAnnotations = body.final_accepted_annotations as FinalAnnotations

    if (!Array.isArray(modelPredictions.detections)) {
      return NextResponse.json(
        { error: 'model_predicted_anomalies.detections must be an array' },
        { status: 400 }
      )
    }

    if (!Array.isArray(finalAnnotations.detections)) {
      return NextResponse.json(
        { error: 'final_accepted_annotations.detections must be an array' },
        { status: 400 }
      )
    }

    // Add timestamp to annotator metadata if not present
    const annotatorMetadata = body.annotator_metadata || {}
    if (!annotatorMetadata.timestamp) {
      annotatorMetadata.timestamp = new Date().toISOString()
    }

    // Calculate user modifications if not provided
    if (!finalAnnotations.userModifications) {
      const added = finalAnnotations.detections.filter(d => d.action === 'added').length
      const edited = finalAnnotations.detections.filter(d => d.action === 'edited').length
      const deleted = finalAnnotations.detections.filter(d => d.action === 'deleted').length
      const confirmed = finalAnnotations.detections.filter(d => d.action === 'confirmed').length
      
      finalAnnotations.userModifications = { added, edited, deleted, confirmed }
    }

    // Set detection counts
    if (modelPredictions.detectionCount === undefined) {
      modelPredictions.detectionCount = modelPredictions.detections.length
    }
    if (finalAnnotations.detectionCount === undefined) {
      finalAnnotations.detectionCount = finalAnnotations.detections.length
    }

    // Save feedback log
    const result = await saveFeedbackLog(
      body.image_id,
      modelPredictions,
      finalAnnotations,
      annotatorMetadata
    )

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to save feedback log' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Feedback log saved successfully',
        data: result,
        summary: {
          image_id: result.image_id,
          model_detections: modelPredictions.detectionCount,
          final_detections: finalAnnotations.detectionCount,
          user_changes: finalAnnotations.userModifications
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/feedback/log:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/feedback/log?limit=100&offset=0
 * 
 * Retrieves feedback logs with optional pagination
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get('limit') ?? '100')
    const offset = Number(searchParams.get('offset') ?? '0')

    // Validate pagination parameters
    if (isNaN(limit) || limit < 1 || limit > 1000) {
      return NextResponse.json(
        { error: 'limit must be between 1 and 1000' },
        { status: 400 }
      )
    }

    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        { error: 'offset must be a non-negative number' },
        { status: 400 }
      )
    }

    const feedbackLogs = await getAllFeedbackLogs(limit, offset)

    if (!feedbackLogs) {
      return NextResponse.json(
        { error: 'Failed to retrieve feedback logs' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: feedbackLogs,
      pagination: {
        limit,
        offset,
        count: feedbackLogs.length
      }
    })
  } catch (error) {
    console.error('Error in GET /api/feedback/log:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
