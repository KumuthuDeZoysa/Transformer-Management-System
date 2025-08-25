"use client"

import type React from "react"
import { use } from "react"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Calendar, MapPin, Zap, Settings, Upload } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"

interface Transformer {
  id: string
  poleNo: string
  region: string
  type: string
  capacity: string
  location: string
  status?: string
  lastInspection?: string
}

interface UploadedImage {
  id: string
  transformerId: string
  filename: string
  imageType: "Baseline" | "Maintenance"
  uploader: string
  uploadDate: string
  comments?: string
  environmentalCondition?: "Sunny" | "Cloudy" | "Rainy"
  imageUrl: string
  status: "Normal" | "Warning" | "Critical"
}

const transformersData: Transformer[] = [
  {
    id: "AZ-8890",
    poleNo: "EN-123-B",
    region: "Maharagama",
    type: "Distribution",
    capacity: "100 kVA",
    location: "Maharagama Junction, Main Road",
    status: "Normal",
    lastInspection: "Mon(21), May, 2023 12:55pm",
  },
  {
    id: "AZ-1649",
    poleNo: "EN-124-A",
    region: "Nugegoda",
    type: "Distribution",
    capacity: "63 kVA",
    location: "Nugegoda Town Center",
    status: "Warning",
    lastInspection: "Tue(22), May, 2023 09:30am",
  },
  {
    id: "AZ-7316",
    poleNo: "EN-125-C",
    region: "Colombo",
    type: "Bulk",
    capacity: "500 kVA",
    location: "Colombo Fort Railway Station",
    status: "Critical",
    lastInspection: "Wed(23), May, 2023 02:15pm",
  },
  {
    id: "AZ-4613",
    poleNo: "EN-126-D",
    region: "Dehiwala",
    type: "Distribution",
    capacity: "160 kVA",
    location: "Dehiwala Beach Road",
    status: "Normal",
    lastInspection: "Thu(24), May, 2023 10:45am",
  },
  {
    id: "AX-8993",
    poleNo: "EN-127-E",
    region: "Mount Lavinia",
    type: "Bulk",
    capacity: "315 kVA",
    location: "Mount Lavinia Hotel Area",
    status: "Normal",
    lastInspection: "Fri(25), May, 2023 03:20pm",
  },
  {
    id: "AY-8790",
    poleNo: "EN-128-F",
    region: "Ratmalana",
    type: "Distribution",
    capacity: "100 kVA",
    location: "Ratmalana Airport Road",
    status: "Warning",
    lastInspection: "Sat(26), May, 2023 11:15am",
  },
]

const mockImages: UploadedImage[] = [
  {
    id: "img-1",
    transformerId: "AZ-8890",
    filename: "thermal-baseline-001.jpg",
    imageType: "Baseline",
    uploader: "John Silva",
    uploadDate: "2023-05-20T10:30:00Z",
    comments: "Initial baseline thermal image",
    environmentalCondition: "Sunny",
    imageUrl: "/thermal-baseline-normal.png",
    status: "Normal",
  },
  {
    id: "img-2",
    transformerId: "AZ-8890",
    filename: "thermal-maintenance-001.jpg",
    imageType: "Maintenance",
    uploader: "Sarah Fernando",
    uploadDate: "2023-05-21T14:15:00Z",
    comments: "Regular maintenance inspection",
    imageUrl: "/thermal-maintenance-normal.png",
    status: "Normal",
  },
  {
    id: "img-3",
    transformerId: "AZ-1649",
    filename: "thermal-baseline-002.jpg",
    imageType: "Baseline",
    uploader: "Mike Perera",
    uploadDate: "2023-05-22T09:00:00Z",
    comments: "Baseline under cloudy conditions",
    environmentalCondition: "Cloudy",
    imageUrl: "/thermal-baseline-warning.png",
    status: "Warning",
  },
  {
    id: "img-4",
    transformerId: "AZ-7316",
    filename: "thermal-critical-001.jpg",
    imageType: "Maintenance",
    uploader: "David Rajapaksa",
    uploadDate: "2023-05-23T16:45:00Z",
    comments: "Critical hotspot detected - immediate attention required",
    imageUrl: "/thermal-critical-hotspot.png",
    status: "Critical",
  },
]

export default function TransformerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [transformer, setTransformer] = useState<Transformer | null>(null)
  const [loading, setLoading] = useState(true)
  const [images, setImages] = useState<UploadedImage[]>([])
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null)
  const [filterType, setFilterType] = useState("all")
  const [filterUploader, setFilterUploader] = useState("all")
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    imageType: "Maintenance" as "Baseline" | "Maintenance",
    uploader: "",
    comments: "",
    environmentalCondition: "Sunny" as "Sunny" | "Cloudy" | "Rainy",
  })

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true) // Ensure loading is true at start
      try {
        // 1) Load transformer by code or uuid from API
        const res = await fetch(`/api/transformers/${resolvedParams.id}`)
        if (res.ok) {
          const t = await res.json()
          if (cancelled) return
          const mapped: Transformer = {
            id: t.code || t.id,
            poleNo: t.pole_no || '',
            region: t.region || '',
            type: (t.type as string) || 'Distribution',
            capacity: t.capacity || '',
            location: t.location || '',
            status: (t.status as string) || 'Normal',
            lastInspection: t.last_inspection || undefined,
          }
          setTransformer(mapped)

          // 2) Load images by transformer uuid (t.id)
          const ir = await fetch(`/api/images?transformer_id=${encodeURIComponent(t.id)}`)
          if (ir.ok) {
            const body = await ir.json()
            const items = Array.isArray(body) ? body : (body.items || [])
            const mappedImages: UploadedImage[] = items.map((img: any) => ({
              id: img.id,
              transformerId: mapped.id,
              filename: img.label || img.url?.split('/')?.pop() || 'image',
              imageType: (img.image_type as 'Baseline' | 'Maintenance') || 'Maintenance',
              uploader: img.uploader || 'Unknown',
              uploadDate: img.created_at || img.captured_at || new Date().toISOString(),
              comments: img.comments || undefined,
              environmentalCondition: img.environmental_condition || undefined,
              imageUrl: img.url || '/placeholder.svg',
              status: (img.status as 'Normal' | 'Warning' | 'Critical') || 'Normal',
            }))
            if (!cancelled) setImages(mappedImages)
          }
          if (!cancelled) setLoading(false)
          return
        }
      } catch (error) {
        console.log('API call failed, falling back to mock data')
      }

      // Fallback to mock if DB failed
      if (cancelled) return
      const foundTransformer = transformersData.find((t) => t.id === resolvedParams.id)
      setTransformer(foundTransformer || null)
      const transformerImages = mockImages.filter((img) => img.transformerId === resolvedParams.id)
      setImages(transformerImages)
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [resolvedParams.id])

  const filteredImages = images.filter((image) => {
    const matchesType = filterType === "all" || image.imageType === filterType
    const matchesUploader = filterUploader === "all" || image.uploader === filterUploader
    return matchesType && matchesUploader
  })

  const uniqueUploaders = [...new Set(images.map((img) => img.uploader))]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Normal":
        return "bg-green-100 text-green-800 border-green-200"
      case "Warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Critical":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Resolve transformer uuid by fetching again (ensures we have the DB id)
      const tres = await fetch(`/api/transformers/${resolvedParams.id}`)
      if (!tres.ok) throw new Error('Transformer not found')
      const t = await tres.json()

      // Minimal metadata insert; using a placeholder URL unless you wire Storage
      const body = {
        transformer_id: t.id, // uuid
        url: '/thermal-image-normal.png',
        label: `thermal-${uploadForm.imageType.toLowerCase()}-${Date.now()}.jpg`,
        captured_at: new Date().toISOString(),
        // Optional extra fields if you later add columns:
        image_type: uploadForm.imageType,
        uploader: uploadForm.uploader,
        comments: uploadForm.comments || null,
        environmental_condition: uploadForm.imageType === 'Baseline' ? uploadForm.environmentalCondition : null,
        status: 'Normal',
      }
      const res = await fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const created = await res.json().catch(() => null)
      if (!res.ok) throw new Error((created && created.error) || 'Image upload failed')

      // Refresh images
      const ir = await fetch(`/api/images?transformer_id=${encodeURIComponent(t.id)}`)
      if (ir.ok) {
        const body = await ir.json()
        const items = Array.isArray(body) ? body : (body.items || [])
        const mappedImages: UploadedImage[] = items.map((img: any) => ({
          id: img.id,
          transformerId: (transformer?.id || resolvedParams.id),
          filename: img.label || img.url?.split('/')?.pop() || 'image',
          imageType: (img.image_type as 'Baseline' | 'Maintenance') || 'Maintenance',
          uploader: img.uploader || 'Unknown',
          uploadDate: img.created_at || img.captured_at || new Date().toISOString(),
          comments: img.comments || undefined,
          environmentalCondition: img.environmental_condition || undefined,
          imageUrl: img.url || '/placeholder.svg',
          status: (img.status as 'Normal' | 'Warning' | 'Critical') || 'Normal',
        }))
        setImages(mappedImages)
      }

      setShowUploadForm(false)
      setUploadForm({ imageType: 'Maintenance', uploader: '', comments: '', environmentalCondition: 'Sunny' })
    } catch (err) {
      console.error('Failed to upload image:', err)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
            <h2 className="text-2xl font-sans font-bold text-foreground mb-2">Loading Transformer Details</h2>
            <p className="text-muted-foreground font-serif">Please wait while we load the transformer information...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!transformer) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-sans font-bold text-foreground mb-2">Transformer Not Found</h2>
            <p className="text-muted-foreground font-serif mb-4">The requested transformer could not be found.</p>
            <Button onClick={() => router.push("/")} className="font-serif cursor-pointer hover:bg-accent transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Transformers
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/")} className="font-serif cursor-pointer hover:bg-accent transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-sans font-bold text-foreground">Transformer {transformer.id}</h1>
              <p className="text-muted-foreground font-serif">{transformer.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(transformer.status || "Normal")}>{transformer.status || "Normal"}</Badge>
            <Button variant="outline" className="font-serif bg-transparent cursor-pointer hover:bg-accent transition-colors">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>

        {/* Transformer Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-serif font-medium">Pole Number</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-sans font-bold">{transformer.poleNo}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-serif font-medium">Region/Branch</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-sans font-bold">{transformer.region}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-serif font-medium">Type & Capacity</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-sans font-bold">{transformer.capacity}</div>
              <p className="text-xs text-muted-foreground font-serif">{transformer.type}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-serif font-medium">Last Inspection</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-sans font-bold">{transformer.lastInspection}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
