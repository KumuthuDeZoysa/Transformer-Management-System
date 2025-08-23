import { NextRequest, NextResponse } from 'next/server'
import cloudinary from '@/lib/cloudinary'
import { createServerClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 })
    }

    const form = await req.formData()
    const file = form.get('file') as File | null
    const transformerId = form.get('transformer_id') as string | null
    const label = (form.get('label') as string | null) || undefined
    if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    if (!transformerId) return NextResponse.json({ error: 'Missing transformer_id' }, { status: 400 })

    // Upload to Cloudinary
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'transformers' },
        (error, result) => (error ? reject(error) : resolve(result))
      )
      stream.end(buffer)
    })

    const imageUrl: string = uploadResult.secure_url
    const supabase = createServerClient()
    const payload = {
      transformer_id: transformerId,
      url: imageUrl,
      label: label ?? uploadResult.original_filename,
      captured_at: new Date().toISOString(),
    }
    const { data, error } = await supabase.from('images').insert(payload).select('*').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ url: imageUrl, image: data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 })
  }
}