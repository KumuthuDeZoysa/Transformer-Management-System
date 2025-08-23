import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createServerClient } from '@/lib/supabase/client'

const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)

export const dynamic = 'force-dynamic'

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
    const matchId = isUuid(code)

    // 1) Ensure the row exists
    const existSel = admin.from('transformers').select('*').limit(1)
    const exist = matchId ? await existSel.eq('id', code).maybeSingle() : await existSel.eq('code', code).maybeSingle()
    if (exist.error) return NextResponse.json({ error: exist.error.message }, { status: 500 })
    if (!exist.data) return NextResponse.json({ error: 'Transformer not found' }, { status: 404 })

    // 2) Build update payload
    const update: any = {
      pole_no: body.poleNo ?? body.pole_no,
      region: body.region,
      type: body.type,
      capacity: body.capacity,
      location: body.location,
      status: body.status,
      last_inspection: body.lastInspection ?? body.last_inspection,
      updated_at: new Date().toISOString(),
    }
    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k])
    if (Object.keys(update).length === 0) {
      // Nothing to update, just return existing row
      return NextResponse.json(exist.data)
    }

    // 3) Perform update and ensure at least one row changed
    const updQry = admin.from('transformers').update(update)
    const updRes = matchId
      ? await updQry.eq('id', code).select('id')
      : await updQry.eq('code', code).select('id')
    if (updRes.error) return NextResponse.json({ error: updRes.error.message }, { status: 500 })
    const updatedCount = Array.isArray(updRes.data) ? updRes.data.length : (updRes.data ? 1 : 0)
    if (updatedCount === 0) return NextResponse.json({ error: 'Update had no effect' }, { status: 404 })

    // 4) Re-fetch latest row and return
    const afterSel = admin.from('transformers').select('*').limit(1)
    const after = matchId ? await afterSel.eq('id', code).maybeSingle() : await afterSel.eq('code', code).maybeSingle()
    if (after.error) return NextResponse.json({ error: after.error.message }, { status: 500 })
  if (after.data) return NextResponse.json(after.data)
  // If we got here, update happened but re-fetch failed; return 200 with no body
  return new NextResponse(null, { status: 200 })
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
  const matchId = isUuid(code)

  // Ensure exists first (clearer 404)
  const existSel = admin.from('transformers').select('id').limit(1)
  const exist = matchId ? await existSel.eq('id', code).maybeSingle() : await existSel.eq('code', code).maybeSingle()
  if (exist.error) return NextResponse.json({ error: exist.error.message }, { status: 500 })
  if (!exist.data) return NextResponse.json({ error: 'Transformer not found' }, { status: 404 })

  // Delete
  const delQry = admin.from('transformers').delete()
  const delRes = matchId ? await delQry.eq('id', code) : await delQry.eq('code', code)
  if (delRes.error) return NextResponse.json({ error: delRes.error.message }, { status: 500 })
  return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete transformer' }, 
      { status: 500 }
    )
  }
}
