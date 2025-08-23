"use client"

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'login'|'signup'>('login')
  const [error, setError] = useState<string|undefined>()

  useEffect(() => {
    // If already logged in, optional redirect by checking /api/auth/me
    fetch('/api/auth/me', { cache: 'no-store' }).then(r => r.json()).then(j => {
      if (j?.user) router.replace('/')
    }).catch(() => {})
  }, [])

  const submit = async () => {
    setLoading(true)
    setError(undefined)
    try {
      const url = tab === 'login' ? '/api/auth/login' : '/api/auth/signup'
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed')
      router.replace('/')
    } catch (e: any) {
      setError(e.message || 'Failed')
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
