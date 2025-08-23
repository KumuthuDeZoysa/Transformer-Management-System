import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createServerClient } from '@/lib/supabase/client'

const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params
    const supabase = createServerClient()

    let res
    if (isUuid(code)) {
      res = await supabase.from('transformers').select('*').eq('id', code).maybeSingle()
    } else {
      res = await supabase.from('transformers').select('*').eq('code', code).maybeSingle()
    }

    if (res.error) return NextResponse.json({ error: res.error.message }, { status: 500 })
    if (!res.data) return NextResponse.json({ error: 'Transformer not found' }, { status: 404 })
    return NextResponse.json(res.data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch transformer' }, 
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params
    const body = await request.json()
    const admin = createAdminClient()

    const update: any = {
      pole_no: body.poleNo ?? body.pole_no,
      region: body.region,
      type: body.type,
      capacity: body.capacity,
      location: body.location,
      status: body.status,
      last_inspection: body.lastInspection ?? body.last_inspection ?? null,
      updated_at: new Date().toISOString(),
    }
    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k])

    let upd
    if (isUuid(code)) {
      upd = await admin.from('transformers').update(update).eq('id', code).select('*').maybeSingle()
    } else {
      upd = await admin.from('transformers').update(update).eq('code', code).select('*').maybeSingle()
    }
    if (upd.error) return NextResponse.json({ error: upd.error.message }, { status: 500 })
    if (!upd.data) return NextResponse.json({ error: 'Transformer not found' }, { status: 404 })
    return NextResponse.json(upd.data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update transformer' }, 
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params
    const admin = createAdminClient()

    let del
    if (isUuid(code)) {
      del = await admin.from('transformers').delete().eq('id', code).select('id')
    } else {
      del = await admin.from('transformers').delete().eq('code', code).select('id')
    }
    if (del.error) return NextResponse.json({ error: del.error.message }, { status: 500 })
    const deleted = Array.isArray(del.data) ? del.data.length : (del.data ? 1 : 0)
    if (deleted === 0) return NextResponse.json({ error: 'Transformer not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete transformer' }, 
      { status: 500 }
    )
  }
}
