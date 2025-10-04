"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Upload, ImageIcon, CheckCircle, Clock, Eye } from 'lucide-react'
import Link from 'next/link'
import { fetchInspections, updateInspection, type DbInspection } from '@/lib/inspections-api'
import backendApi, { type BackendTransformer, type BackendInspection } from '@/lib/backend-api'
import { transformerApi } from '@/lib/mock-api'
import { AnomalyViewer } from '@/components/anomaly-viewer'

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

interface ImageUpload {
  id: string
  inspectionId: string
  fileName: string
  imageType: "baseline" | "maintenance"
  uploaderName: string
  uploadDateTime: string
  comments?: string
  environmentalCondition?: "sunny" | "cloudy" | "rainy"
  status: "uploading" | "analyzing" | "complete"
}

export default function InspectionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const inspectionId = params.id as string

  // Inspection data
  const [inspection, setInspection] = useState<DbInspection | null>(null)
  const [transformer, setTransformer] = useState<BackendTransformer | null>(null)
  const [baselineImages, setBaselineImages] = useState<any[]>([])
  const [maintenanceImages, setMaintenanceImages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [backendConnected, setBackendConnected] = useState(false)
  
  // Image upload states
  const [imageType, setImageType] = useState<"baseline" | "maintenance" | "">("")
  const [uploaderName, setUploaderName] = useState("")
  const [comments, setComments] = useState("")
  const [environmentalCondition, setEnvironmentalCondition] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [imageUploads, setImageUploads] = useState<ImageUpload[]>([])
  const [showReplaceBaselineForm, setShowReplaceBaselineForm] = useState(false)
  
  // Anomaly detection states
  const [showAnomalyAnalysis, setShowAnomalyAnalysis] = useState(false)
  const [hasCompletedAIAnalysis, setHasCompletedAIAnalysis] = useState(false)

  useEffect(() => {
    const loadInspection = async () => {
      try {
        setLoading(true)
        console.log('🔄 [Page Load] Loading inspection:', inspectionId)
        
        // Check if backend is available
        const healthCheck = await backendApi.health.checkBackendStatus()
        console.log('🏥 [Backend Health]:', healthCheck.status)
        setBackendConnected(healthCheck.status === 'healthy')

        // For now, we'll continue using the existing inspections API until it's updated
        // This is because the inspections API is more complex and would need significant changes
        const [inspections] = await Promise.all([
          fetchInspections(),
        ])
        
        const currentInspection = inspections.find((i: any) => i.id === inspectionId)
        if (!currentInspection) {
          router.push('/inspections')
          return
        }
        
        setInspection(currentInspection)
        
        // Get transformer data using backend API if available
        if (healthCheck.status === 'healthy') {
          try {
            console.log('🚀 Loading transformer from Spring Boot backend...')
            const backendTransformers = await backendApi.transformers.getAll()
            const relatedTransformer = backendTransformers.find((t: BackendTransformer) => 
              t.id === currentInspection.transformer_id || t.code === currentInspection.transformer_id
            )
            if (relatedTransformer) {
              setTransformer(relatedTransformer)
            }
          } catch (error) {
            console.error('Failed to load transformer from backend:', error)
          }
        }
        
        // If no transformer found from backend, try mock data
        if (!transformer && !backendConnected) {
          console.log('📡 Loading transformer from mock data...')
          try {
            const mockTransformers = await transformerApi.getAll()
            const relatedTransformer = mockTransformers.find((t: any) => t.id === currentInspection.transformer_id)
            if (relatedTransformer) {
              // Convert mock transformer to backend format for consistency
              const converted: BackendTransformer = {
                id: relatedTransformer.id,
                code: relatedTransformer.id,
                poleNo: relatedTransformer.poleNo,
                region: relatedTransformer.region,
                type: relatedTransformer.type,
                capacity: relatedTransformer.capacity,
                location: relatedTransformer.location,
                status: relatedTransformer.status,
                lastInspection: relatedTransformer.lastInspection,
                createdAt: relatedTransformer.createdAt,
                updatedAt: relatedTransformer.updatedAt,
              }
              setTransformer(converted)
            }
          } catch (error) {
            console.error('Failed to load transformer from mock data:', error)
          }
        }

        // Load existing images for this transformer and inspection
        // THIS IS CRITICAL: Images must persist across page refreshes for Phase 3 version control
        if (healthCheck.status === 'healthy') {
          console.log('📸 [Image Loading] Starting to load images from backend...')
          console.log('   - Inspection ID:', inspectionId)
          console.log('   - Transformer ID:', currentInspection.transformer_id)
          
          // Load baseline image for THIS specific inspection
          const baselineImage = await backendApi.images.getBaselineImageByInspection(inspectionId)
          if (baselineImage) {
            console.log('✅ [Baseline] Found baseline image:', baselineImage.id)
            console.log('   - URL:', baselineImage.url)
            console.log('   - Captured:', baselineImage.capturedAt)
            setBaselineImages([baselineImage])
          } else {
            console.log('ℹ️ [Baseline] No baseline image exists for this inspection yet')
            setBaselineImages([])
          }
          
          // Load maintenance images for THIS specific inspection
          const inspectionImages = await backendApi.images.getByInspectionId(inspectionId)
          const maintenanceOnly = inspectionImages.filter((img: any) => img.imageType === 'maintenance')
          
          if (maintenanceOnly.length > 0) {
            console.log(`✅ [Maintenance] Found ${maintenanceOnly.length} maintenance image(s)`)
            maintenanceOnly.forEach((img: any, index: number) => {
              console.log(`   ${index + 1}. ID: ${img.id}, URL: ${img.url}, Captured: ${img.capturedAt}`)
            })
            setMaintenanceImages(maintenanceOnly)
          } else {
            console.log('ℹ️ [Maintenance] No maintenance images exist for this inspection yet')
            setMaintenanceImages([])
          }
          
          console.log('✅ [Image Loading] Complete - Baseline:', baselineImage ? '1' : '0', ', Maintenance:', maintenanceOnly.length)
        } else {
          // Fallback to Next.js API if backend is not available
          console.warn('⚠️ Backend not available, using Next.js API fallback')
          try {
            const imagesResponse = await fetch(`/api/images?transformer_id=${currentInspection.transformer_id}`)
            if (imagesResponse.ok) {
              const imagesData = await imagesResponse.json()
              const allImages = imagesData.items || []
              
              // Separate baseline and maintenance images using label-based logic
              const baseline = allImages.filter((img: any) => 
                img.label && img.label.includes('[baseline]')
              )
              const maintenance = allImages.filter((img: any) => 
                img.label && (
                  img.label.includes('[maintenance]') && (
                    img.label.includes(inspectionId) ||
                    img.label.includes(currentInspection.inspection_no || '')
                  )
                )
              )
              
              setBaselineImages(baseline)
              setMaintenanceImages(maintenance)
            }
          } catch (error) {
            console.error('❌ Failed to load images from Next.js API:', error)
            setBaselineImages([])
            setMaintenanceImages([])
          }
        }
      } catch (error) {
        console.error('Failed to load inspection:', error)
        router.push('/inspections')
      } finally {
        setLoading(false)
      }
    }

    if (inspectionId) {
      loadInspection()
    }
  }, [inspectionId, router])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const refreshImages = async () => {
    console.log('🔄 [Refresh] Reloading images for inspection:', inspectionId)
    
    if (!inspection?.transformer_id) {
      console.warn('⚠️ [Refresh] No inspection or transformer ID available')
      return
    }

    if (backendConnected) {
      // Load baseline image for THIS specific inspection
      const baselineImage = await backendApi.images.getBaselineImageByInspection(inspectionId)
      if (baselineImage) {
        console.log('✅ [Refresh-Baseline] Found baseline image:', baselineImage.id)
        setBaselineImages([baselineImage])
      } else {
        console.log('ℹ️ [Refresh-Baseline] No baseline image found')
        setBaselineImages([])
      }
      
      // Load maintenance images for THIS specific inspection
      const inspectionImages = await backendApi.images.getByInspectionId(inspectionId)
      const maintenanceOnly = inspectionImages.filter((img: any) => img.imageType === 'maintenance')
      
      if (maintenanceOnly.length > 0) {
        console.log(`✅ [Refresh-Maintenance] Found ${maintenanceOnly.length} maintenance image(s)`)
        setMaintenanceImages(maintenanceOnly)
      } else {
        console.log('ℹ️ [Refresh-Maintenance] No maintenance images found')
        setMaintenanceImages([])
      }
      
      console.log('✅ [Refresh] Complete - Baseline:', baselineImage ? '1' : '0', ', Maintenance:', maintenanceOnly.length)
    } else {
      // Fallback to Next.js API
      console.warn('⚠️ Backend not available during refresh, using Next.js API')
      try {
        const imagesResponse = await fetch(`/api/images?transformer_id=${inspection.transformer_id}`)
        if (imagesResponse.ok) {
          const imagesData = await imagesResponse.json()
          const allImages = imagesData.items || []
          
          // Separate baseline and maintenance images using label-based logic
          const baseline = allImages
            .filter((img: any) => img.label && img.label.includes('[baseline]'))
            .sort((a: any, b: any) => new Date(b.capturedAt || b.uploadedAt || 0).getTime() - new Date(a.capturedAt || a.uploadedAt || 0).getTime())
          
          const maintenance = allImages.filter((img: any) => 
            img.label && (
              img.label.includes('[maintenance]') && (
                img.label.includes(inspectionId) ||
                !img.label.match(/\[inspection:([a-f0-9-]+)\]/) ||
                img.label.match(/\[inspection:([a-f0-9-]+)\]/)?.[1] === inspectionId
              )
            )
          )
          
          setBaselineImages(baseline.slice(0, 1))
          setMaintenanceImages(maintenance)
          console.log('✅ [Refresh] Complete (Next.js API) - Baseline:', baseline.length > 0 ? '1' : '0', ', Maintenance:', maintenance.length)
        }
      } catch (error) {
        console.error('❌ Failed to refresh images via Next.js API:', error)
      }
    }
  }
  
  // Refresh inspection data (especially status) after anomaly analysis
  const refreshInspectionStatus = async () => {
    console.log('🔄 [Refresh] Reloading inspection status:', inspectionId)
    
    try {
      const [inspections] = await Promise.all([
        fetchInspections(),
      ])
      
      const currentInspection = inspections.find((i: any) => i.id === inspectionId)
      if (currentInspection) {
        setInspection(currentInspection)
        console.log('✅ [Refresh] Inspection status updated:', currentInspection.status)
      }
      
      // Mark AI analysis as complete
      setHasCompletedAIAnalysis(true)
      console.log('✅ [Progress] AI Analysis marked as complete')
    } catch (error) {
      console.error('❌ [Refresh] Failed to reload inspection status:', error)
    }
  }

  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!imageType || !uploaderName || !selectedFile) {
      alert("Please fill in all required fields and select a file")
      return
    }

    if (!environmentalCondition) {
      alert("Please select environmental condition")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 10
      })
    }, 200)

    try {
      let uploadResult

      if (backendConnected) {
        // Use backend API for direct upload
        uploadResult = await backendApi.upload.uploadImageToBackend(
          selectedFile,
          inspection?.transformer_id || '',
          imageType as 'baseline' | 'maintenance',
          uploaderName,
          environmentalCondition as 'sunny' | 'cloudy' | 'rainy',
          comments || undefined,
          inspectionId, // IMPORTANT: Link both baseline AND maintenance to this inspection
          `${selectedFile.name} - ${imageType} by ${uploaderName}`
        )
      } else {
        // Fallback to Next.js API route
        const form = new FormData()
        form.append('file', selectedFile)
        form.append('transformer_id', inspection?.transformer_id || '')
        
        // Create structured label with all metadata
        let structuredLabel = `${selectedFile.name} [${imageType}]`;
        // Add environmental condition for both baseline and maintenance
        structuredLabel += ` [env:${environmentalCondition}]`;
        if (comments) {
          structuredLabel += ` [comments:${comments}]`;
        }
        if (imageType === "maintenance") {
          structuredLabel += ` [inspection:${inspection?.inspection_no || inspectionId}]`;
        }
        if (uploaderName && uploaderName.trim() !== "") {
          structuredLabel += ` by ${uploaderName.trim()}`;
        }
        form.append('label', structuredLabel);

        const resp = await fetch('/api/upload-image', {
          method: 'POST',
          body: form,
        })
        uploadResult = await resp.json().catch(() => null)
        if (!resp.ok) throw new Error((uploadResult && uploadResult.error) || 'Upload failed')
      }

      const newUpload: ImageUpload = {
        id: Date.now().toString(),
        inspectionId,
        fileName: selectedFile.name,
        imageType: imageType as 'baseline' | 'maintenance',
        uploaderName,
        uploadDateTime: new Date().toISOString(),
        comments: comments || undefined,
        environmentalCondition: imageType === 'baseline' ? (environmentalCondition as 'sunny' | 'cloudy' | 'rainy') : undefined,
        status: 'analyzing'
      }
      
      setImageUploads((prev) => [...prev, newUpload])

      // Refresh existing images from the server
      await refreshImages()

      // Simulate analysis completion
      setTimeout(() => {
        setImageUploads(prev => prev.map(img => 
          img.id === newUpload.id ? { ...img, status: 'complete' } : img
        ))
        
        // Scroll to comparison section if both baseline and maintenance images exist
        setTimeout(() => {
          const comparisonSection = document.querySelector('[data-comparison-section]')
          if (comparisonSection) {
            comparisonSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 500)
      }, 3000)

      // Reset form
      setImageType("")
      setUploaderName("")
      setComments("")
      setEnvironmentalCondition("")
      setSelectedFile(null)
      setUploadProgress(0)
      setShowReplaceBaselineForm(false)
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg font-serif text-muted-foreground">Loading inspection details...</div>
        </div>
      </MainLayout>
    )
  }

  if (!inspection || !transformer) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg font-serif text-muted-foreground">Inspection not found</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/inspections">
            <Button variant="ghost" size="icon" className="cursor-pointer hover:bg-accent transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-sans font-bold text-foreground">
                {inspection.inspection_no || 'Inspection Details'}
              </h1>
              <Badge variant={inspection.status === 'Completed' ? 'outline' : inspection.status === 'Pending' ? 'secondary' : 'default'}>
                {inspection.status}
              </Badge>
            </div>
            <p className="text-muted-foreground font-serif">
              {new Date(inspection.inspected_at).toLocaleString('en-US', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-serif">Last updated:</span>
            <span className="text-sm font-serif">
              {new Date(inspection.updated_at).toLocaleString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
              })}
            </span>
            <Badge variant="outline" className="ml-2">
              {inspection.status === 'In Progress' ? 'In progress' : inspection.status}
            </Badge>
          </div>
        </div>

        {/* Transformer Info Cards */}
        <div className={`grid gap-4 ${inspection.status === 'Pending' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-4'}`}>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-sm text-muted-foreground font-serif">Transformer No.</div>
              <div className="text-lg font-sans font-semibold">{transformer.code || transformer.id}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-sm text-muted-foreground font-serif">Pole No.</div>
              <div className="text-lg font-sans font-semibold">{transformer.poleNo || 'N/A'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-sm text-muted-foreground font-serif">Branch</div>
              <div className="text-lg font-sans font-semibold">{transformer.region || 'N/A'}</div>
            </CardContent>
          </Card>
          {inspection.status !== 'Pending' && (
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-sm text-muted-foreground font-serif">Inspected By</div>
                <div className="text-lg font-sans font-semibold">A-110</div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Baseline Image Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-sans">Baseline Image</CardTitle>
                  <CardDescription className="font-serif">
                    Reference image for future comparisons
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {baselineImages.length > 0 ? 'Available' : 'Missing'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {baselineImages.length > 0 && !showReplaceBaselineForm ? (
                <div className="space-y-4">
                  {/* Display existing baseline image */}
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-serif font-medium">Current Baseline</span>
                      <Button variant="outline" size="sm" className="cursor-pointer hover:bg-accent" onClick={() => window.open(baselineImages[0].url, '_blank')}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground font-serif mb-2">
                      Uploaded: {baselineImages[0].capturedAt ? new Date(baselineImages[0].capturedAt).toLocaleString() : 'Unknown date'}
                    </p>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="w-full transition-all duration-300 ease-in-out hover:bg-red-600 hover:scale-105 hover:shadow-lg hover:shadow-red-500/25 active:scale-95 cursor-pointer"
                      onClick={() => {
                        setShowReplaceBaselineForm(true)
                        setImageType("baseline")
                        setSelectedFile(null)
                        setUploaderName("")
                        setComments("")
                        setEnvironmentalCondition("")
                      }}
                    >
                      Replace Baseline Image
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {showReplaceBaselineForm && baselineImages.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-blue-800 font-serif">
                        You are about to replace the existing baseline image. The old image will be archived.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2 cursor-pointer hover:bg-accent"
                        onClick={() => setShowReplaceBaselineForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                  <form onSubmit={handleImageUpload} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="weather" className="font-serif">
                      Environmental Condition *
                    </Label>
                    <Select value={environmentalCondition} onValueChange={setEnvironmentalCondition}>
                      <SelectTrigger className="font-serif">
                        <SelectValue placeholder="Select environmental condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sunny">Sunny</SelectItem>
                        <SelectItem value="cloudy">Cloudy</SelectItem>
                        <SelectItem value="rainy">Rainy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uploaderName" className="font-serif">
                      Uploader Name *
                    </Label>
                    <Input
                      id="uploaderName"
                      value={uploaderName}
                      onChange={(e) => setUploaderName(e.target.value)}
                      placeholder="Enter your name"
                      className="font-serif"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-serif">Baseline Image File *</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                      <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <div className="space-y-1">
                        {selectedFile && imageType === "baseline" ? (
                          <div>
                            <p className="text-sm font-serif text-foreground font-medium">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground font-serif">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-serif text-foreground">
                              Drop baseline image here, or{" "}
                              <label htmlFor="baseline-file-upload" className="text-primary hover:underline cursor-pointer">
                                browse
                              </label>
                            </p>
                            <p className="text-xs text-muted-foreground font-serif">
                              Supports: JPG, PNG, TIFF (Max 10MB)
                            </p>
                          </>
                        )}
                      </div>
                      <Input
                        id="baseline-file-upload"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          handleFileSelect(e)
                          setImageType("baseline")
                        }}
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full font-serif cursor-pointer hover:bg-primary/90 transition-colors" 
                    disabled={isUploading || !selectedFile || imageType !== "baseline"}
                  >
                    {isUploading && imageType === "baseline" ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Uploading Baseline...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Baseline Image
                      </>
                    )}
                  </Button>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Maintenance Image Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-sans">Thermal Image</CardTitle>
                  <CardDescription className="font-serif">
                    Upload maintenance image for this inspection
                  </CardDescription>
                </div>
                <Badge variant="secondary">Pending</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleImageUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="uploaderName2" className="font-serif">
                    Uploader Name *
                  </Label>
                  <Input
                    id="uploaderName2"
                    value={uploaderName}
                    onChange={(e) => setUploaderName(e.target.value)}
                    placeholder="Enter your name"
                    className="font-serif"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="environmentalCondition2" className="font-serif">
                    Environmental Condition *
                  </Label>
                  <Select value={environmentalCondition} onValueChange={setEnvironmentalCondition}>
                    <SelectTrigger className="font-serif">
                      <SelectValue placeholder="Select environmental condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sunny">Sunny</SelectItem>
                      <SelectItem value="cloudy">Cloudy</SelectItem>
                      <SelectItem value="rainy">Rainy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comments" className="font-serif">
                    Comments (Optional)
                  </Label>
                  <Textarea
                    id="comments"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Add any additional notes or observations..."
                    className="font-serif"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-serif">Thermal Image File *</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <div className="space-y-1">
                      {selectedFile && imageType === "maintenance" ? (
                        <div>
                          <p className="text-sm font-serif text-foreground font-medium">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground font-serif">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-serif text-foreground">
                            Drop maintenance image here, or{" "}
                            <label htmlFor="maintenance-file-upload" className="text-primary hover:underline cursor-pointer">
                              browse
                            </label>
                          </p>
                          <p className="text-xs text-muted-foreground font-serif">
                            Supports: JPG, PNG, TIFF (Max 10MB)
                          </p>
                        </>
                      )}
                    </div>
                    <Input
                      id="maintenance-file-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        handleFileSelect(e)
                        setImageType("maintenance")
                      }}
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full font-serif" 
                  disabled={isUploading || !selectedFile || imageType !== "maintenance"}
                >
                  {isUploading && imageType === "maintenance" ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload thermal image
                    </>
                  )}
                </Button>
              </form>

              {/* Display maintenance images for this inspection */}
              {maintenanceImages.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <h4 className="font-sans font-semibold mb-3 text-sm">Uploaded Images</h4>
                  <div className="space-y-2">
                    {maintenanceImages.map((image) => {
                      return (
                        <div key={image.id} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                          <div className="flex-1">
                            <p className="text-sm font-serif font-medium">{image.label || 'Thermal Image'}</p>
                            <p className="text-xs text-muted-foreground font-serif">
                              {image.imageType ? `${image.imageType} • ` : ''}{image.environmentalCondition || 'Unknown'} • {image.capturedAt ? new Date(image.capturedAt).toLocaleString() : 'Unknown date'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => window.open(image.url, '_blank')}>
                              <Eye className="h-3 w-3" />
                            </Button>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Thermal Image Comparison Section */}
        {baselineImages.length > 0 && maintenanceImages.length > 0 && (
          <Card className="mt-6" data-comparison-section>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-sans">Thermal Image Comparison</CardTitle>
                  <CardDescription className="font-serif">
                    Side-by-side comparison of baseline and current thermal images
                  </CardDescription>
                </div>
                <Badge variant="default">Analysis Ready</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Baseline Image */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-sans font-semibold text-sm">Baseline</h4>
                    <Badge variant="outline" className="text-xs">Reference</Badge>
                  </div>
                  <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden border">
                    <img
                      src={getImageUrl(baselineImages[0].url)}
                      alt="Baseline thermal image"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Failed to load baseline image:', baselineImages[0].url)
                        e.currentTarget.src = '/placeholder.jpg'
                      }}
                    />
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-serif">
                      {baselineImages[0].capturedAt ? new Date(baselineImages[0].capturedAt).toLocaleDateString() : 'Invalid Date'} {baselineImages[0].capturedAt ? new Date(baselineImages[0].capturedAt).toLocaleTimeString() : 'Invalid Date'}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground font-serif">
                    {baselineImages[0].environmentalCondition || 'Unknown'} conditions{baselineImages[0].uploaderName ? ` • ${baselineImages[0].uploaderName}` : ''}
                  </div>
                </div>

                {/* Current/Maintenance Image */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-sans font-semibold text-sm">Current</h4>
                    <Badge variant="secondary" className="text-xs">Maintenance</Badge>
                  </div>
                  <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden border">
                    <img
                      src={getImageUrl(maintenanceImages[maintenanceImages.length - 1].url)}
                      alt="Current thermal image"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Failed to load maintenance image:', maintenanceImages[maintenanceImages.length - 1].url)
                        e.currentTarget.src = '/placeholder.jpg'
                      }}
                    />
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-serif">
                      {maintenanceImages[maintenanceImages.length - 1].capturedAt ? new Date(maintenanceImages[maintenanceImages.length - 1].capturedAt).toLocaleDateString() : 'Invalid Date'} {maintenanceImages[maintenanceImages.length - 1].capturedAt ? new Date(maintenanceImages[maintenanceImages.length - 1].capturedAt).toLocaleTimeString() : 'Invalid Date'}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground font-serif">
                    {maintenanceImages[maintenanceImages.length - 1].environmentalCondition || 'Unknown'} conditions • {maintenanceImages[maintenanceImages.length - 1].imageType ? maintenanceImages[maintenanceImages.length - 1].imageType.charAt(0).toUpperCase() + maintenanceImages[maintenanceImages.length - 1].imageType.slice(1) : 'Unknown type'} • Inspection #{maintenanceImages[maintenanceImages.length - 1].inspectionNo || inspection?.inspection_no || 'null'}{maintenanceImages[maintenanceImages.length - 1].comments ? ` • ${maintenanceImages[maintenanceImages.length - 1].comments}` : ''}
                  </div>
                </div>
              </div>

              {/* Note: Analysis results will appear in the Anomaly Detection section below */}
            </CardContent>
          </Card>
        )}

        {/* Anomaly Detection Analysis Section */}
        {baselineImages.length > 0 && maintenanceImages.length > 0 && (
          <Card className="col-span-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-sans flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Anomaly Detection & Analysis
                  </CardTitle>
                  <CardDescription className="font-serif">
                    AI-powered thermal image comparison with automatic anomaly marking
                  </CardDescription>
                </div>
                <Button
                  variant={showAnomalyAnalysis ? "outline" : "default"}
                  size="sm"
                  onClick={() => setShowAnomalyAnalysis(!showAnomalyAnalysis)}
                  className="cursor-pointer hover:bg-accent transition-colors"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {showAnomalyAnalysis ? "Hide Analysis" : "Analyze Images"}
                </Button>
              </div>
            </CardHeader>
            {showAnomalyAnalysis && (
              <CardContent>
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <h5 className="font-sans font-semibold text-sm text-blue-800 dark:text-blue-200 mb-1">
                        Automatic Anomaly Marking
                      </h5>
                      <p className="text-sm text-blue-700 dark:text-blue-300 font-serif mb-2">
                        Images are automatically annotated with color-coded overlays and severity scores:
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded font-serif flex items-center gap-1">
                          <div className="w-3 h-3 rounded bg-red-500"></div>
                          Red: High Severity (≥0.8)
                        </span>
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded font-serif flex items-center gap-1">
                          <div className="w-3 h-3 rounded bg-orange-500"></div>
                          Orange: Medium Severity (≥0.5)
                        </span>
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-serif flex items-center gap-1">
                          <div className="w-3 h-3 rounded bg-yellow-500"></div>
                          Yellow: Low Severity (&lt;0.5)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <AnomalyViewer
                  baselineUrl={getImageUrl(baselineImages[0].url)}
                  maintenanceUrl={getImageUrl(maintenanceImages[maintenanceImages.length - 1].url)}
                  inspectionId={inspectionId}
                  onAnalysisComplete={refreshInspectionStatus}
                />
              </CardContent>
            )}
          </Card>
        )}

        {/* Progress Section */}
        <Card>
          <CardHeader>
            <CardTitle className="font-sans">Progress</CardTitle>
            <CardDescription className="font-serif">
              Track inspection workflow and image analysis status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Thermal Image Upload Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-yellow-600"></div>
                  </div>
                  <span className="text-sm font-serif">Thermal Image Upload</span>
                </div>
                <span className="text-sm text-yellow-600 font-serif">
                  {isUploading ? `${uploadProgress}%` : (baselineImages.length > 0 || maintenanceImages.length > 0) ? "Complete" : "Pending"}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 ml-8">
                <div
                  className="h-1.5 rounded-full transition-all duration-300 bg-yellow-600"
                  style={{ 
                    width: isUploading ? `${uploadProgress}%` : (baselineImages.length > 0 || maintenanceImages.length > 0) ? '100%' : '0%' 
                  }}
                ></div>
              </div>
            </div>

            {/* AI Analysis Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    hasCompletedAIAnalysis ? 'bg-green-100' : 'bg-yellow-100'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      hasCompletedAIAnalysis ? 'bg-green-600' : 'bg-yellow-600'
                    }`}></div>
                  </div>
                  <span className="text-sm font-serif">AI Analysis</span>
                </div>
                <span className={`text-sm font-serif ${
                  hasCompletedAIAnalysis ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {hasCompletedAIAnalysis ? "Complete" : "Pending"}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 ml-8">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    hasCompletedAIAnalysis ? 'bg-green-600' : 'bg-yellow-600'
                  }`}
                  style={{ 
                    width: hasCompletedAIAnalysis ? '100%' : '0%'
                  }}
                ></div>
              </div>
            </div>

            {/* Thermal Image Review Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-yellow-600"></div>
                  </div>
                  <span className="text-sm font-serif">Thermal Image Review</span>
                </div>
                <span className="text-sm text-yellow-600 font-serif">Pending</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 ml-8">
                <div className="h-1.5 rounded-full bg-yellow-600 w-0"></div>
              </div>
            </div>

            {/* Recently uploaded images */}
            {imageUploads.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="font-sans font-semibold mb-3 text-sm">Recent Activity</h4>
                <div className="space-y-2">
                  {imageUploads.map((upload) => (
                    <div key={upload.id} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                      <div className="flex-1">
                        <p className="text-sm font-serif font-medium">{upload.fileName}</p>
                        <p className="text-xs text-muted-foreground font-serif">
                          {upload.imageType} • {upload.uploaderName} • {new Date(upload.uploadDateTime).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Eye className="h-3 w-3" />
                        </Button>
                        {upload.status === 'complete' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : upload.status === 'analyzing' ? (
                          <Clock className="h-4 w-4 text-yellow-600 animate-spin" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
