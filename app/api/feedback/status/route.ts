import { NextRequest, NextResponse } from 'next/server'
import { checkFeedbackTableExists, initializeFeedbackSystem } from '@/lib/feedback-db-setup'

export const dynamic = 'force-dynamic'

/**
 * GET /api/feedback/status
 * 
 * Check if the feedback logging system is properly set up
 */
export async function GET(req: NextRequest) {
  try {
    const result = await initializeFeedbackSystem()

    return NextResponse.json({
      ready: result.ready,
      message: result.message,
      setupInstructions: result.setupInstructions || null
    })
  } catch (error) {
    console.error('Error checking feedback system status:', error)
    return NextResponse.json(
      { 
        ready: false,
        error: 'Failed to check feedback system status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
