import { NextRequest, NextResponse } from 'next/server'
import cloudinary from '@/lib/cloudinary'

export const dynamic = 'force-dynamic'

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080/api'

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 })
    }

    const form = await req.formData()
    const file = form.get('file') as File | null
    const transformerId = form.get('transformer_id') as string | null
    const inspectionId = form.get('inspection_id') as string | null
    const imageType = form.get('image_type') as string | null
    const uploaderName = form.get('uploader_name') as string | null
    const environmentalCondition = form.get('environmental_condition') as string | null
    const comments = form.get('comments') as string | null
    const label = (form.get('label') as string | null) || undefined
    
    if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    if (!transformerId) return NextResponse.json({ error: 'Missing transformer_id' }, { status: 400 })

    // Upload to Cloudinary
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { 
          folder: inspectionId ? `inspections/${inspectionId}` : 'transformers',
          tags: [
            transformerId,
            ...(inspectionId ? [inspectionId] : []),
            ...(imageType ? [imageType] : [])
          ]
        },
        (error, result) => (error ? reject(error) : resolve(result))
      )
      stream.end(buffer)
    })

    const imageUrl: string = uploadResult.secure_url
    
    // Try to save metadata to Spring Boot backend first
    try {
      const backendFormData = new FormData()
      backendFormData.append('file', file)
      backendFormData.append('transformer_id', transformerId)
      
      if (imageType) backendFormData.append('image_type', imageType)
      if (uploaderName) backendFormData.append('uploader_name', uploaderName)
      if (environmentalCondition) backendFormData.append('environmental_condition', environmentalCondition)
      if (comments) backendFormData.append('comments', comments)
      if (inspectionId) backendFormData.append('inspection_id', inspectionId)
      if (label) backendFormData.append('label', label)
      
      const backendResponse = await fetch(`${BACKEND_BASE_URL}/images/upload`, {
        method: 'POST',
        body: backendFormData,
      })
      
      if (backendResponse.ok) {
        const backendResult = await backendResponse.json()
        return NextResponse.json({
          url: imageUrl,
          image: backendResult.image,
          message: 'Uploaded via Spring Boot backend',
          source: 'backend'
        }, { status: 201 })
      }
      
      console.warn('Backend upload failed, falling back to legacy storage')
    } catch (backendError) {
      console.warn('Backend not available, using legacy storage:', backendError)
    }
    
    // Fallback: Return basic response for legacy compatibility
    // Note: This should eventually be removed once backend is fully integrated
    const fallbackImage = {
      id: uploadResult.public_id,
      transformer_id: transformerId,
      url: imageUrl,
      label: label || uploadResult.original_filename,
      captured_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    }
    
    return NextResponse.json({
      url: imageUrl,
      image: fallbackImage,
      message: 'Uploaded via legacy route (backend unavailable)',
      source: 'legacy'
    }, { status: 201 })

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 })
  }
}