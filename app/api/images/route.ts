import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080/api'

// GET /api/images?transformer_id=... -> list images (optionally by transformer)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const transformerId = searchParams.get('transformer_id')
  const inspectionId = searchParams.get('inspection_id')
  const imageType = searchParams.get('image_type')

  try {
    // Try to fetch from Spring Boot backend first
    let backendUrl = `${BACKEND_BASE_URL}/images`
    const params = new URLSearchParams()
    
    if (transformerId) params.append('transformerId', transformerId)
    if (inspectionId) params.append('inspectionId', inspectionId)
    if (imageType) params.append('imageType', imageType)
    
    if (params.toString()) {
      backendUrl += '?' + params.toString()
    }

    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (backendResponse.ok) {
      const backendData = await backendResponse.json()
      // Ensure data is in the expected format
      const items = Array.isArray(backendData) ? backendData : backendData.items || []
      return NextResponse.json({ 
        items, 
        source: 'backend',
        message: 'Data from Spring Boot backend'
      })
    }

    console.warn('Backend not available for image retrieval, returning empty result')
    
  } catch (error) {
    console.warn('Error fetching from backend:', error)
  }

  // Fallback: return empty array if backend is not available
  return NextResponse.json({ 
    items: [], 
    source: 'fallback',
    message: 'Backend unavailable - returning empty result'
  })
}

// POST /api/images -> create image metadata (expects URL, transformer_id, etc.)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Try to save to Spring Boot backend first
    const backendPayload = {
      transformer: { id: body.transformer_id },
      url: body.url,
      label: body.label || null,
      imageType: body.image_type || null,
      uploaderName: body.uploader_name || null,
      environmentalCondition: body.environmental_condition || null,
      comments: body.comments || null,
      inspection: body.inspection_id ? { id: body.inspection_id } : null,
      capturedAt: body.captured_at || new Date().toISOString(),
    }

    const backendResponse = await fetch(`${BACKEND_BASE_URL}/images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(backendPayload),
    })

    if (backendResponse.ok) {
      const backendData = await backendResponse.json()
      return NextResponse.json({
        ...backendData,
        source: 'backend',
        message: 'Saved to Spring Boot backend'
      }, { status: 201 })
    }

    console.warn('Backend save failed, returning error')
    return NextResponse.json({ 
      error: 'Backend unavailable for image creation' 
    }, { status: 503 })

  } catch (error) {
    console.error('Error saving to backend:', error)
    return NextResponse.json({ 
      error: 'Failed to save image metadata' 
    }, { status: 500 })
  }
}
