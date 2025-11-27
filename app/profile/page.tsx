"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { authApi } from '@/lib/auth-api'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<{ username: string; role?: string } | null>(null)

  useEffect(() => {
    if (authApi.isAuthenticated()) {
      const currentUser = authApi.getCurrentUserLocal();
      setUser(currentUser);
    } else {
      router.replace('/login');
    }
  }, [router])

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
