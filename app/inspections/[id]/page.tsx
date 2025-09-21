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

  useEffect(() => {
    const loadInspection = async () => {
      try {
        setLoading(true)
        
        // Check if backend is available
        const healthCheck = await backendApi.health.checkBackendStatus()
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
        try {
          const imagesResponse = await fetch(`/api/images?transformer_id=${currentInspection.transformer_id}`)
          if (imagesResponse.ok) {
            const imagesData = await imagesResponse.json()
            const allImages = imagesData.items || []
            
            // Separate baseline and maintenance images
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
          console.error('Failed to load existing images:', error)
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
    try {
      const imagesResponse = await fetch(`/api/images?transformer_id=${inspection?.transformer_id}`)
      if (imagesResponse.ok) {
        const imagesData = await imagesResponse.json()
        const allImages = imagesData.items || []
        
        // Separate baseline and maintenance images
        const baseline = allImages.filter((img: any) => 
          img.label && img.label.includes('[baseline]')
        )
        const maintenance = allImages.filter((img: any) => 
          img.label && (
            img.label.includes('[maintenance]') && (
              img.label.includes(inspectionId) ||
              img.label.includes(inspection?.inspection_no || '')
            )
          )
        )
        
        setBaselineImages(baseline)
        setMaintenanceImages(maintenance)
      }
    } catch (error) {
      console.error('Failed to refresh images:', error)
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
      // Upload to server -> Cloudinary
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
      const data = await resp.json().catch(() => null)
      if (!resp.ok) throw new Error((data && data.error) || 'Upload failed')

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
              {new Date(inspection.inspected_at).toLocaleDateString('en-US', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-serif">Last updated:</span>
            <span className="text-sm font-serif">
              {new Date(inspection.updated_at).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
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
                      Uploaded: {new Date(baselineImages[0].captured_at).toLocaleString()}
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
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer" 
                         onClick={() => document.getElementById('baseline-file-upload')?.click()}>
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
                      const labelParts = image.label.split('[');
                      const fileName = labelParts[0]?.trim() || image.label;
                      const envMatch = image.label.match(/\[env:([^\]]+)\]/);
                      const environment = envMatch ? envMatch[1] : 'Unknown';
                      // Extract image type (maintenance or baseline)
                      let imageType = null;
                      const typeMatch = image.label.match(/\[(baseline|maintenance)\]/);
                      if (typeMatch && typeMatch[1]) {
                        imageType = typeMatch[1];
                      }
                      return (
                        <div key={image.id} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                          <div className="flex-1">
                            <p className="text-sm font-serif font-medium">{fileName}</p>
                            <p className="text-xs text-muted-foreground font-serif">
                              {imageType ? `${imageType} • ` : ''}{environment} • {new Date(image.captured_at).toLocaleString()}
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
                      src={baselineImages[0].url}
                      alt="Baseline thermal image"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-serif">
                      {new Date(baselineImages[0].captured_at).toLocaleDateString()} {new Date(baselineImages[0].captured_at).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground font-serif">
                    {(() => {
                      const envMatch = baselineImages[0].label.match(/\[env:([^\]]+)\]/)
                      // Extract uploader name, but ignore if it's just '[maintenance]' or contains 'Unknown'
                      let uploader = null;
                      const uploaderMatch = baselineImages[0].label.match(/by ([^\[]+)/);
                      if (uploaderMatch && uploaderMatch[1]) {
                        const cleaned = uploaderMatch[1].replace(/\[.*\]/g, '').trim();
                        if (cleaned && cleaned.toLowerCase() !== 'unknown') {
                          uploader = cleaned;
                        }
                      }
                      return `${envMatch ? envMatch[1] : 'Unknown'} conditions${uploader ? ` • ${uploader}` : ''}`;
                    })()}
                  </div>
                </div>

                {/* Current/Maintenance Image */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-sans font-semibold text-sm">Current</h4>
                    <Badge variant="destructive" className="text-xs">Anomaly Detected</Badge>
                  </div>
                  <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden border">
                    <img
                      src={maintenanceImages[maintenanceImages.length - 1].url}
                      alt="Current thermal image"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-serif">
                      {new Date(maintenanceImages[maintenanceImages.length - 1].captured_at).toLocaleDateString()} {new Date(maintenanceImages[maintenanceImages.length - 1].captured_at).toLocaleTimeString()}
                    </div>
                    {/* Anomaly indicators */}
                    <div className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <div className="absolute top-1/3 left-1/2 w-16 h-16 border-2 border-red-500 rounded transform -translate-x-1/2 -translate-y-1/2"></div>
                  </div>
                  <div className="text-xs text-muted-foreground font-serif">
                    {(() => {
                      const envMatch = maintenanceImages[maintenanceImages.length - 1].label.match(/\[env:([^\]]+)\]/)
                      const commentsMatch = maintenanceImages[maintenanceImages.length - 1].label.match(/\[comments:([^\]]+)\]/)
                      // Extract image type (maintenance or baseline)
                      let imageType = null;
                      const typeMatch = maintenanceImages[maintenanceImages.length - 1].label.match(/\[(baseline|maintenance)\]/);
                      if (typeMatch && typeMatch[1]) {
                        imageType = typeMatch[1];
                      }
                      return `${envMatch ? envMatch[1] : 'Unknown'} conditions • ${imageType ? imageType.charAt(0).toUpperCase() + imageType.slice(1) : 'Unknown type'} • Inspection #${inspection?.inspection_no}${commentsMatch ? ` • ${commentsMatch[1]}` : ''}`;
                    })()}
                  </div>
                </div>
              </div>

              {/* Analysis Summary */}
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-sans font-semibold text-sm text-red-800 mb-1">Temperature Anomaly Detected</h5>
                    <p className="text-sm text-red-700 font-serif mb-2">
                      Significant temperature increase detected compared to baseline. Hot spot identified in the upper section of the transformer.
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded font-serif">
                        Δ Temperature: +15°C
                      </span>
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded font-serif">
                        Risk Level: High
                      </span>
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded font-serif">
                        Action Required: Immediate
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4">
                <Button variant="outline" size="sm" className="font-serif">
                  <Eye className="h-4 w-4 mr-2" />
                  View Full Analysis
                </Button>
                <Button variant="outline" size="sm" className="font-serif">
                  Export Report
                </Button>
                <Button variant="outline" size="sm" className="font-serif">
                  Schedule Maintenance
                </Button>
              </div>
            </CardContent>
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
                  <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-yellow-600"></div>
                  </div>
                  <span className="text-sm font-serif">AI Analysis</span>
                </div>
                <span className="text-sm text-yellow-600 font-serif">
                  {imageUploads.some(img => img.status === 'complete') ? "Complete" : 
                   imageUploads.some(img => img.status === 'analyzing') ? "In Progress" : "Pending"}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 ml-8">
                <div
                  className="h-1.5 rounded-full transition-all duration-500 bg-yellow-600"
                  style={{ 
                    width: imageUploads.some(img => img.status === 'complete') ? '100%' : 
                           imageUploads.some(img => img.status === 'analyzing') ? '60%' : '0%'
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
