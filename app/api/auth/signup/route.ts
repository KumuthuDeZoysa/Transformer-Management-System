
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'
import { hashPassword } from '@/lib/hash'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const body = await req.json()
  const username = (body.username || '').trim()
  const password = (body.password || '').trim()
  if (!username || !password) return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
  const { data: existing, error: existErr } = await supabase.from('users').select('id').eq('username', username).maybeSingle()
  if (existErr) return NextResponse.json({ error: existErr.message }, { status: 500 })
  if (existing) return NextResponse.json({ error: 'Username already exists' }, { status: 409 })
  const hashedPassword = hashPassword(password)
  const { data, error } = await supabase.from('users').insert({ username, password: hashedPassword }).select('id, username').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const token = `${data.id}:${username}`
  const res = NextResponse.json({ id: data.id, username })
  res.cookies.set('app_session', token, { httpOnly: true, sameSite: 'lax', path: '/' })
  return res
}
