"use client"

import { Bell, Search, AlertTriangle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { authApi } from "@/lib/auth-api"
import { transformerApi } from "@/lib/backend-api"

export function Header() {
  const recentAlerts = [
    {
      type: 'critical' as const,
      message: 'Temperature Threshold Exceeded - Transformer AZ-8070 in Nugegoda has exceeded temperature threshold (95°C). Immediate action required.',
      time: 'July 25, 2025 - 04:32 AM',
    },
    {
      type: 'success' as const,
      message: 'Maintenance Completed - Scheduled maintenance for Transformer AZ-5678 in Nugegoda has been completed successfully. All parameters normal.',
      time: 'July 24, 2025 - 04:32 AM',
    },
    {
      type: 'warning' as const,
      message: 'Warning: Unusual Vibration Detected - Transformer AZ-9012 showing abnormal vibration patterns.',
      time: 'July 23, 2025 - 11:20 PM',
    },
  ]
  const [user, setUser] = useState<{ username: string; role?: string } | null>(null)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Array<{ id: string; code: string | null; location: string | null }>>([])
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter()
  
  useEffect(() => {
    // Load user from JWT token on mount
    const loadUser = () => {
      if (authApi.isAuthenticated()) {
        const currentUser = authApi.getCurrentUserLocal();
        setUser(currentUser);
      } else {
        setUser(null);
      }
    };
    
    loadUser();
    
    // Listen for storage events (for cross-tab synchronization)
    window.addEventListener('storage', loadUser);
    return () => window.removeEventListener('storage', loadUser);
  }, [])

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!query) { setResults([]); return }
      try {
        // Search transformers using backend API with JWT auth
        const allTransformers = await transformerApi.getAll()
        // Filter by code on client side
        const filtered = allTransformers.filter(t => 
          t.code?.toLowerCase().includes(query.toLowerCase()) ||
          t.id?.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 8)
        setResults(filtered || [])
        setOpen(true)
      } catch (err) {
        console.error('Search failed:', err)
        setResults([])
      }
    }, 150)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as any)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])
  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex items-center space-x-4 flex-1 max-w-md" ref={boxRef}>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search transformers by ID..."
              className="pl-10 font-serif"
              value={query}
              onChange={(e) => { setQuery(e.target.value); if (!e.target.value) setOpen(false) }}
              onFocus={() => { if (results.length > 0) setOpen(true) }}
            />
            {open && results.length > 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
                {results.map((t) => (
                  <button
                    key={t.id}
                    className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm font-serif"
                    onClick={() => { router.push(`/transformer/${t.code || t.id}`); setOpen(false) }}
                  >
                    <div className="font-medium">{t.code || t.id}</div>
                    {t.location && <div className="text-xs text-muted-foreground">{t.location}</div>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full text-xs flex items-center justify-center text-destructive-foreground">
                  {recentAlerts.length}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 p-0">
              <div className="p-3 border-b"><span className="text-sm font-medium">Notifications</span></div>
              <div className="max-h-80 overflow-auto py-2">
                {recentAlerts.map((alert, idx) => (
                  <div key={idx} className="px-3 py-2 hover:bg-accent/40">
                    <div className="flex items-start gap-2">
                      {alert.type === 'critical' && <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />}
                      {alert.type === 'success' && <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />}
                      {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-serif text-foreground leading-relaxed line-clamp-3">{alert.message}</div>
                        <div className="text-xs text-muted-foreground font-serif mt-1">{alert.time}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <Avatar className="h-8 w-8 border-1 border-black shadow-sm">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    {user?.username ? user.username.substring(0, 2).toUpperCase() : 'IP'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="text-sm font-serif font-medium">{user?.username || 'Guest'}</div>
                  <div className="text-xs text-muted-foreground">
                    {user?.role ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {user.role}
                      </span>
                    ) : (
                      'Not signed in'
                    )}
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>My Account</div>
                {user?.role && (
                  <div className="text-xs font-normal text-muted-foreground mt-1">
                    Role: <span className="font-semibold text-primary">{user.role}</span>
                  </div>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/profile')}>Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings')}>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              {user ? (
                <DropdownMenuItem onClick={async () => { 
                  await authApi.logout(); 
                  setUser(null);
                  router.replace('/login');
                }}>Sign out</DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => router.push('/login')}>Sign in</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
