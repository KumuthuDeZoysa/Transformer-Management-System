"use client"

import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import backendApi from '@/lib/backend-api'

interface BackendStatusProps {
  onStatusChange?: (status: 'healthy' | 'unhealthy') => void
}

export function BackendStatus({ onStatusChange }: BackendStatusProps) {
  const [status, setStatus] = useState<'healthy' | 'unhealthy' | 'checking'>('checking')
  const [message, setMessage] = useState('')
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const checkStatus = async () => {
    setStatus('checking')
    try {
      const result = await backendApi.health.checkBackendStatus()
      setStatus(result.status)
      setMessage(result.message)
      setLastChecked(new Date())
      onStatusChange?.(result.status)
    } catch (error) {
      setStatus('unhealthy')
      setMessage('Failed to check backend status')
      setLastChecked(new Date())
      onStatusChange?.('unhealthy')
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  const getStatusColor = () => {
    switch (status) {
      case 'healthy': return 'bg-green-500'
      case 'unhealthy': return 'bg-red-500'
      case 'checking': return 'bg-yellow-500'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'healthy': return <Wifi className="h-4 w-4" />
      case 'unhealthy': return <WifiOff className="h-4 w-4" />
      case 'checking': return <RefreshCw className="h-4 w-4 animate-spin" />
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="flex items-center gap-2">
        {getStatusIcon()}
        <span className="text-xs">
          Backend: {status === 'checking' ? 'Checking...' : status}
        </span>
      </Badge>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={checkStatus}
        disabled={status === 'checking'}
        className="h-6 px-2"
      >
        <RefreshCw className={`h-3 w-3 ${status === 'checking' ? 'animate-spin' : ''}`} />
      </Button>
      
      {status !== 'checking' && (
        <Alert className={`${status === 'healthy' ? 'border-green-200' : 'border-red-200'} p-2`}>
          <AlertDescription className="text-xs">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
              {message}
              {lastChecked && (
                <span className="text-muted-foreground">
                  (checked at {lastChecked.toLocaleTimeString()})
                </span>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}