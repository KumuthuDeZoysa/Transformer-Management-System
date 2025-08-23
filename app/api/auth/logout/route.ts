import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(_: NextRequest) {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('app_session', '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 })
  return res
}
