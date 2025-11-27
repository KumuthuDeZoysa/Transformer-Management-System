"use client"

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { authApi } from '@/lib/auth-api'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'login'|'signup'>('login')
  const [error, setError] = useState<string|undefined>()

  useEffect(() => {
    // If already logged in, redirect to home
    if (authApi.isAuthenticated()) {
      router.replace('/')
    }
  }, [router])

  const submit = async () => {
    setLoading(true)
    setError(undefined)
    try {
      if (tab === 'login') {
        await authApi.login({ username, password })
      } else {
        await authApi.signup({ username, password })
      }
      // Force a full page reload to ensure all components pick up the new auth state
      window.location.href = '/'
    } catch (e: any) {
      setError(e.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-md mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle className="font-sans">Welcome</CardTitle>
            <CardDescription className="font-serif">Sign in to continue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="space-y-3" />
              <TabsContent value="signup" className="space-y-3" />
            </Tabs>
            <div className="space-y-2">
              <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="font-serif" />
              <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="font-serif" />
            </div>
            {error && <div className="text-sm text-red-600 font-serif">{error}</div>}
            <Button className="w-full font-serif" onClick={submit} disabled={loading || !username || !password}>{loading ? 'Please wait...' : (tab === 'login' ? 'Login' : 'Create Account')}</Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
