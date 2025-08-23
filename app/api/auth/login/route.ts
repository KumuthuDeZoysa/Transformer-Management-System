import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const body = await req.json()
  const username = (body.username || '').trim()
  const password = (body.password || '').trim()
  if (!username || !password) return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
  // For now accept any password for existing username
  const { data, error } = await supabase.from('users').select('id, username').eq('username', username).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  const token = `${data.id}:${username}`
  const res = NextResponse.json({ id: data.id, username })
  res.cookies.set('app_session', token, { httpOnly: true, sameSite: 'lax', path: '/' })
  return res
}
