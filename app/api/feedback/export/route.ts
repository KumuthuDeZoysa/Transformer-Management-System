import { NextRequest, NextResponse } from 'next/server'
import { getAllFeedbackLogs } from '@/lib/feedback-api'

export const dynamic = 'force-dynamic'

/**
 * GET /api/feedback/export?format=json
 * 
 * Exports all feedback logs in JSON or CSV format
 * 
 * Query parameters:
 * - format: 'json' | 'csv' (default: 'json')
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format')?.toLowerCase() || 'json'

    if (!['json', 'csv'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Supported formats: json, csv' },
        { status: 400 }
      )
    }

    // Get all feedback logs (no pagination limit for export)
    const feedbackLogs = await getAllFeedbackLogs(10000, 0)

    if (!feedbackLogs) {
      return NextResponse.json(
        { error: 'Failed to retrieve feedback logs' },
        { status: 500 }
      )
    }

    if (format === 'json') {
      // Return JSON format
      return NextResponse.json(
        {
          export_date: new Date().toISOString(),
          total_records: feedbackLogs.length,
          data: feedbackLogs
        },
        {
          headers: {
            'Content-Disposition': `attachment; filename="feedback_logs_${Date.now()}.json"`,
            'Content-Type': 'application/json',
          },
        }
      )
    } else {
      // Return CSV format
      const csv = convertToCSV(feedbackLogs)
      return new NextResponse(csv, {
        headers: {
          'Content-Disposition': `attachment; filename="feedback_logs_${Date.now()}.csv"`,
          'Content-Type': 'text/csv',
        },
      })
    }
  } catch (error) {
    console.error('Error in GET /api/feedback/export:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Convert feedback logs to CSV format
 */
function convertToCSV(feedbackLogs: any[]): string {
  if (feedbackLogs.length === 0) {
    return 'id,image_id,model_predicted_anomalies,final_accepted_annotations,annotator_metadata,created_at\n'
  }

  // CSV Headers
  const headers = [
    'id',
    'image_id',
    'model_predicted_anomalies',
    'final_accepted_annotations',
    'annotator_metadata',
    'created_at'
  ]

  // CSV Rows
  const rows = feedbackLogs.map(log => {
    return [
      escapeCSV(log.id || ''),
      escapeCSV(log.image_id || ''),
      escapeCSV(JSON.stringify(log.model_predicted_anomalies || {})),
      escapeCSV(JSON.stringify(log.final_accepted_annotations || {})),
      escapeCSV(JSON.stringify(log.annotator_metadata || {})),
      escapeCSV(log.created_at || '')
    ].join(',')
  })

  return [headers.join(','), ...rows].join('\n')
}

/**
 * Escape CSV special characters
 */
function escapeCSV(value: string): string {
  if (value === null || value === undefined) {
    return ''
  }
  
  const stringValue = String(value)
  
  // If the value contains comma, newline, or double quote, wrap it in quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    // Escape double quotes by doubling them
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  
  return stringValue
}
