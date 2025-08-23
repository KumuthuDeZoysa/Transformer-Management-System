import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'

export async function POST(_req: NextRequest) {
  const supabase = createServerClient()

  // Seed transformers
  const transformers = [
    { name: 'TX-100', location: 'Substation A', status: 'normal' },
    { name: 'TX-200', location: 'Substation B', status: 'warning' },
    { name: 'TX-300', location: 'Substation C', status: 'critical' },
  ]

  const { data: tData, error: tErr } = await supabase.from('transformers').insert(transformers).select('id')
  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 })

  const [t1, t2, t3] = tData ?? []

  // Seed images (metadata only, using public placeholders hosted in /public for demo)
  const images = [
    { transformer_id: t1?.id, url: '/thermal-image-transformer.png', label: 'baseline normal', captured_at: new Date().toISOString() },
    { transformer_id: t2?.id, url: '/thermal-transformer-hot.png', label: 'hotspot', captured_at: new Date().toISOString() },
    { transformer_id: t3?.id, url: '/thermal-transformer-critical.png', label: 'critical hotspot', captured_at: new Date().toISOString() },
  ].filter(i => i.transformer_id)

  const { error: iErr } = await supabase.from('images').insert(images)
  if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 })

  return NextResponse.json({ ok: true, transformers: tData?.length ?? 0, images: images.length })
}
