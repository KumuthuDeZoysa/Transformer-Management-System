"use client"

import { useEffect, useMemo, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Eye, Download, ArrowLeft, Upload, X, Calendar, User, MessageSquare, Camera, RefreshCw } from "lucide-react"
import Link from "next/link"

// Helper function to construct full image URL from backend
const getImageUrl = (url: string): string => {
  if (!url) return ''
  // If already a full URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  // If relative path, prepend backend URL
  const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
  return `${backendBaseUrl}${url.startsWith('/') ? url : '/' + url}`
}

// Types from our minimal DB/API
type DbImage = {
  id: string
  transformer_id: string
  url: string
  label: string | null
  captured_at: string | null
}

type DbTransformer = {
  id: string
  code: string | null
  region: string | null
  location: string | null
  status?: 'Normal' | 'Warning' | 'Critical' | null
}

// UI model used by the gallery
type GalleryImage = {
  id: string
  transformerId: string // display code or uuid
  type: "Baseline" | "Maintenance" | "Image"
  weather: string
  date: string
  uploader: string
  comments?: string
  status: "Normal" | "Warning" | "Critical"
  thumbnail: string
  fullImage: string
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [weatherFilter, setWeatherFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)

  // Load from real DB via our API routes
  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [tRes, iRes] = await Promise.all([
        fetch("/api/transformers?limit=500", { cache: "no-store" }),
        fetch("/api/images", { cache: "no-store" }),
      ])
      if (!tRes.ok) throw new Error("Failed to load transformers")
      if (!iRes.ok) throw new Error("Failed to load images")
      const transformers: DbTransformer[] = await tRes.json()
  const imagesPayload = await iRes.json()
  const imagesRows: DbImage[] = Array.isArray(imagesPayload) ? imagesPayload : (imagesPayload.items || [])

      const tMap = new Map<string, DbTransformer>()
      transformers.forEach((t) => tMap.set(t.id, t))

    const mapped: GalleryImage[] = imagesRows.map((img) => {
        const t = tMap.get(img.transformer_id || "")
        const code = t?.code || t?.id || img.transformer_id
        const when = img.captured_at ? new Date(img.captured_at) : new Date()
        const label = img.label || ""
        const type: GalleryImage["type"] = /base/i.test(label) ? "Baseline" : /maint/i.test(label) ? "Maintenance" : "Image"
        return {
          id: img.id,
          transformerId: String(code),
          type,
          weather: "-",
          date: when.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      uploader: "System",
          comments: label || undefined,
      status: (t?.status as any) || "Normal",
          thumbnail: getImageUrl(img.url),
          fullImage: getImageUrl(img.url),
        }
      })

      setImages(mapped)
    } catch (e: any) {
      setError(e.message || "Failed to load gallery")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredImages = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return images.filter((image) => {
      const matchesSearch =
        image.transformerId.toLowerCase().includes(term) || (image.comments || "").toLowerCase().includes(term)
      const matchesType = typeFilter === "all" || image.type.toLowerCase() === typeFilter
      const matchesWeather = weatherFilter === "all" || image.weather.toLowerCase() === weatherFilter
      const matchesStatus = statusFilter === "all" || image.status.toLowerCase() === statusFilter
      return matchesSearch && matchesType && matchesWeather && matchesStatus
    })
  }, [images, searchTerm, typeFilter, weatherFilter, statusFilter])

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
              <h1 className="text-3xl font-sans font-bold text-foreground">Image Gallery</h1>
              <p className="text-muted-foreground font-serif">Browse thermal images and inspection results</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadData} className="font-serif bg-transparent">
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>

          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="font-sans">Filter Images</CardTitle>
            <CardDescription className="font-serif">
              Search and filter thermal images by various criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by transformer ID or uploader..."
                  className="pl-10 font-serif"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="font-serif">
                  <SelectValue placeholder="Image Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="baseline">Baseline</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>

              <Select value={weatherFilter} onValueChange={setWeatherFilter}>
                <SelectTrigger className="font-serif">
                  <SelectValue placeholder="Weather" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Weather</SelectItem>
                  <SelectItem value="sunny">Sunny</SelectItem>
                  <SelectItem value="cloudy">Cloudy</SelectItem>
                  <SelectItem value="rainy">Rainy</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="font-serif">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Image Grid */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground font-serif">Loading images…</div>
        ) : error ? (
          <div className="text-center py-12 text-red-600 font-serif">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredImages.map((image) => (
              <Card key={image.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video relative cursor-pointer" onClick={() => setSelectedImage(image)}>
                  <img
                    src={image.thumbnail || "/placeholder.svg"}
                    alt={`Thermal image for ${image.transformerId}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant={
                        image.status === "Normal" ? "default" : image.status === "Warning" ? "secondary" : "destructive"
                      }
                      className="font-serif"
                    >
                      {image.status}
                    </Badge>
                  </div>
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Eye className="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-sans font-semibold text-lg">{image.transformerId}</h3>
                      <Badge variant="outline" className="font-serif text-xs">
                        {image.type}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground font-serif">
                      <div className="flex items-center gap-2">
                        <Camera className="h-3 w-3" />
                        <span>Weather: {image.weather}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>{image.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        <span>{image.uploader}</span>
                      </div>
                      {image.comments && (
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-3 w-3 mt-0.5" />
                          <span className="text-xs line-clamp-2">{image.comments}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 font-serif bg-transparent"
                        onClick={() => setSelectedImage(image)}
                      >
                        <Eye className="mr-1 h-3 w-3" />
                        View
                      </Button>
                      <a href={image.fullImage} download target="_blank" rel="noreferrer" className="flex-1">
                        <Button variant="outline" size="sm" className="w-full font-serif bg-transparent">
                          <Download className="mr-1 h-3 w-3" />
                          Download
                        </Button>
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto" showCloseButton={false}>
            {selectedImage && (
              <div className="space-y-4">
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle className="font-sans">
                      {selectedImage.transformerId} - {selectedImage.type} Image
                    </DialogTitle>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedImage(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </DialogHeader>

                <div className="space-y-4">
                  <img
                    src={selectedImage.fullImage || "/placeholder.svg"}
                    alt={`Full thermal image for ${selectedImage.transformerId}`}
                    className="w-full h-auto rounded-lg"
                  />

                  <div className="grid grid-cols-2 gap-4 text-sm font-serif">
                    <div>
                      <strong>Transformer ID:</strong> {selectedImage.transformerId}
                    </div>
                    <div>
                      <strong>Type:</strong> {selectedImage.type}
                    </div>
                    <div>
                      <strong>Date:</strong> {selectedImage.date}
                    </div>
                    <div>
                      <strong>Weather:</strong> {selectedImage.weather}
                    </div>
                    <div>
                      <strong>Uploader:</strong> {selectedImage.uploader}
                    </div>
                    <div>
                      <strong>Status:</strong>
                      <Badge
                        variant={
                          selectedImage.status === "Normal"
                            ? "default"
                            : selectedImage.status === "Warning"
                              ? "secondary"
                              : "destructive"
                        }
                        className="ml-2 font-serif"
                      >
                        {selectedImage.status}
                      </Badge>
                    </div>
                  </div>

                  {selectedImage.comments && (
                    <div className="text-sm font-serif">
                      <strong>Comments:</strong>
                      <p className="mt-1 text-muted-foreground">{selectedImage.comments}</p>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <a href={selectedImage.fullImage} download target="_blank" rel="noreferrer">
                      <Button className="font-serif">
                        <Download className="mr-2 h-4 w-4" />
                        Download Full Resolution
                      </Button>
                    </a>
                    <Button variant="outline" className="font-serif bg-transparent">
                      Generate Report
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Load More / Empty State */}
        {!loading && !error && (
          filteredImages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground font-serif">No images found matching your criteria.</p>
            </div>
          ) : (
            <div className="text-center">
              <Button variant="outline" className="font-serif bg-transparent">
                Load More Images ({filteredImages.length} of {images.length} shown)
              </Button>
            </div>
          )
        )}
      </div>
    </MainLayout>
  )
}
