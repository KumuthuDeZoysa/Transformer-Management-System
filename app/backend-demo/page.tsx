"use client"

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BackendStatus } from '@/components/ui/backend-status'
import { Separator } from '@/components/ui/separator'
import { DataTable } from '@/components/ui/data-table'
import { ArrowLeft, Plus, Edit, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Import backend API
import backendApi, { type BackendTransformer } from '@/lib/backend-api'

export default function BackendDemoPage() {
  const router = useRouter()
  const [backendStatus, setBackendStatus] = useState<'healthy' | 'unhealthy'>('unhealthy')
  const [transformers, setTransformers] = useState<BackendTransformer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadTransformers = async () => {
    if (backendStatus !== 'healthy') return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await backendApi.transformers.getAll()
      setTransformers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transformers')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transformer?')) return
    
    try {
      await backendApi.transformers.delete(id)
      setTransformers(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      alert('Failed to delete transformer: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleCreate = async () => {
    try {
      const newTransformer = await backendApi.transformers.create({
        code: `TX-${Date.now()}`,
        poleNo: 'P001',
        region: 'Colombo',
        type: 'Distribution',
        capacity: '100kVA',
        location: 'Test Location',
        status: 'Normal'
      })
      setTransformers(prev => [...prev, newTransformer])
    } catch (err) {
      alert('Failed to create transformer: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  // Load data when backend becomes available
  useEffect(() => {
    if (backendStatus === 'healthy') {
      loadTransformers()
    }
  }, [backendStatus])

  const columns = [
    {
      key: 'code' as keyof BackendTransformer,
      header: 'Code',
      render: (value: string) => <span className="font-mono">{value || 'N/A'}</span>
    },
    {
      key: 'poleNo' as keyof BackendTransformer,
      header: 'Pole No.'
    },
    {
      key: 'region' as keyof BackendTransformer,
      header: 'Region'
    },
    {
      key: 'type' as keyof BackendTransformer,
      header: 'Type'
    },
    {
      key: 'capacity' as keyof BackendTransformer,
      header: 'Capacity'
    },
    {
      key: 'status' as keyof BackendTransformer,
      header: 'Status',
      render: (value: string) => (
        <Badge variant={value === 'Normal' ? 'default' : value === 'Warning' ? 'secondary' : 'destructive'}>
          {value}
        </Badge>
      )
    },
    {
      key: 'id' as keyof BackendTransformer,
      header: 'Actions',
      render: (value: string, transformer: BackendTransformer) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => router.push(`/transformer/${transformer.id}`)}
          >
            <Eye className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleDelete(transformer.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )
    }
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Backend Integration Demo</h1>
              <p className="text-muted-foreground">Testing Spring Boot backend connectivity</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <BackendStatus onStatusChange={setBackendStatus} />
            {backendStatus === 'healthy' && (
              <Button onClick={handleCreate} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Test Transformer
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Backend Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {backendStatus === 'healthy' ? '✅ Connected' : '❌ Disconnected'}
              </div>
              <p className="text-xs text-muted-foreground">
                Spring Boot on localhost:8080
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Transformers Loaded</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transformers.length}</div>
              <p className="text-xs text-muted-foreground">
                From backend API
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">API Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {backendStatus === 'healthy' ? '🚀 Active' : '💤 Inactive'}
              </div>
              <p className="text-xs text-muted-foreground">
                CRUD operations available
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transformers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transformers from Backend</CardTitle>
            <CardDescription>
              Data loaded directly from Spring Boot API endpoints
            </CardDescription>
          </CardHeader>
          <CardContent>
            {backendStatus !== 'healthy' && (
              <Alert>
                <AlertDescription>
                  Backend is not available. Please ensure the Spring Boot server is running on localhost:8080.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  Error loading data: {error}
                </AlertDescription>
              </Alert>
            )}

            {backendStatus === 'healthy' && !error && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Showing {transformers.length} transformers
                  </p>
                  <Button onClick={loadTransformers} disabled={loading} variant="outline" size="sm">
                    {loading ? 'Loading...' : 'Refresh'}
                  </Button>
                </div>
                
                {transformers.length > 0 ? (
                  <DataTable 
                    data={transformers} 
                    columns={columns}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No transformers found. Create one using the button above.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}