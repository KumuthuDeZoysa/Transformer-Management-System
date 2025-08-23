"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<{ username: string } | null>(null)

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' }).then(r => r.json()).then(j => {
      if (!j?.user) router.replace('/login')
      else setUser(j.user)
    })
  }, [])

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle className="font-sans">My Profile</CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="font-serif">Logged in as <strong>{user.username}</strong></div>
            ) : (
              <div className="font-serif text-muted-foreground">Loading…</div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
