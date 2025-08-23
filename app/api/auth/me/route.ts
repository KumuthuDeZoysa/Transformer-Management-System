import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(_: NextRequest) {
  const c = await cookies()
  const token = c.get('app_session')?.value
  if (!token) return NextResponse.json({ user: null })
  const [, username] = token.split(':')
  return NextResponse.json({ user: { username } })
}
