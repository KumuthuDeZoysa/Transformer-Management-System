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
import { fetchTransformersFromDb, type DbTransformer } from '@/lib/db-api'

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
  const [transformer, setTransformer] = useState<DbTransformer | null>(null)
  const [existingImages, setExistingImages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Image upload states
  const [imageType, setImageType] = useState<"baseline" | "maintenance" | "">("")
  const [uploaderName, setUploaderName] = useState("")
  const [comments, setComments] = useState("")
  const [environmentalCondition, setEnvironmentalCondition] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [imageUploads, setImageUploads] = useState<ImageUpload[]>([])

  useEffect(() => {
    const loadInspection = async () => {
      try {
        setLoading(true)
        const [inspections, transformers] = await Promise.all([
          fetchInspections(),
          fetchTransformersFromDb(),
        ])
        
        const currentInspection = inspections.find(i => i.id === inspectionId)
        if (!currentInspection) {
          router.push('/inspections')
          return
        }
        
        const relatedTransformer = transformers.find(t => t.id === currentInspection.transformer_id)
        
        setInspection(currentInspection)
        setTransformer(relatedTransformer || null)

        // Load existing images for this inspection
        try {
          // Since we don't have inspection_id column yet, load by transformer_id
          const imagesResponse = await fetch(`/api/images?transformer_id=${currentInspection.transformer_id}`)
          if (imagesResponse.ok) {
            const imagesData = await imagesResponse.json()
            // Filter images that might be related to this inspection by checking the label
            const relatedImages = (imagesData.items || []).filter((img: any) => 
              img.label && (
                img.label.includes(inspectionId) ||
                img.label.includes(currentInspection.inspection_no || '')
              )
            )
            setExistingImages(relatedImages)
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

  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!imageType || !uploaderName || !selectedFile) {
      alert("Please fill in all required fields and select a file")
      return
    }

    if (imageType === "baseline" && !environmentalCondition) {
      alert("Please select environmental condition for baseline images")
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
      form.append('inspection_id', inspectionId)
      form.append('image_type', imageType)
      form.append('uploader_name', uploaderName)
      // Include inspection number in the label for association
      const labelWithInspection = `${selectedFile.name} - ${inspection?.inspection_no || inspectionId}`
      form.append('label', labelWithInspection)
      if (comments) form.append('comments', comments)
      if (environmentalCondition) form.append('environmental_condition', environmentalCondition)

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
      try {
        const imagesResponse = await fetch(`/api/images?transformer_id=${inspection?.transformer_id}`)
        if (imagesResponse.ok) {
          const imagesData = await imagesResponse.json()
          // Filter images that might be related to this inspection
          const relatedImages = (imagesData.items || []).filter((img: any) => 
            img.label && (
              img.label.includes(inspectionId) ||
              img.label.includes(inspection?.inspection_no || '')
            )
          )
          setExistingImages(relatedImages)
        }
      } catch (error) {
        console.error('Failed to refresh images:', error)
      }

      // Simulate analysis completion
      setTimeout(() => {
        setImageUploads(prev => prev.map(img => 
          img.id === newUpload.id ? { ...img, status: 'complete' } : img
        ))
      }, 3000)

      // Reset form
      setImageType("")
      setUploaderName("")
      setComments("")
      setEnvironmentalCondition("")
      setSelectedFile(null)
      setUploadProgress(0)
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
            <Button variant="ghost" size="icon">
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-sm text-muted-foreground font-serif">Transformer No.</div>
              <div className="text-lg font-sans font-semibold">{transformer.code || transformer.id}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-sm text-muted-foreground font-serif">Pole No.</div>
              <div className="text-lg font-sans font-semibold">{transformer.pole_no || 'N/A'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-sm text-muted-foreground font-serif">Branch</div>
              <div className="text-lg font-sans font-semibold">{transformer.region || 'N/A'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-sm text-muted-foreground font-serif">Inspected By</div>
              <div className="text-lg font-sans font-semibold">A-110</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Thermal Image Upload */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-sans">Thermal Image</CardTitle>
                  <CardDescription className="font-serif">
                    Upload a thermal image of the transformer to identify potential issues
                  </CardDescription>
                </div>
                <Badge variant="secondary">Pending</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleImageUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="imageType" className="font-serif">
                    Image Type *
                  </Label>
                  <Select
                    value={imageType}
                    onValueChange={(value: "baseline" | "maintenance") => {
                      setImageType(value)
                      if (value !== "baseline") {
                        setEnvironmentalCondition("")
                      }
                    }}
                  >
                    <SelectTrigger className="font-serif">
                      <SelectValue placeholder="Select image type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baseline">Baseline</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {imageType === "baseline" && (
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
                )}

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
                      {selectedFile ? (
                        <div>
                          <p className="text-sm font-serif text-foreground font-medium">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground font-serif">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-serif text-foreground">
                            Drop your thermal image here, or{" "}
                            <label htmlFor="file-upload" className="text-primary hover:underline cursor-pointer">
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
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileSelect}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full font-serif" disabled={isUploading}>
                  {isUploading ? (
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
            </CardContent>
          </Card>

          {/* Progress Tracking */}
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
                    {isUploading ? `${uploadProgress}%` : imageUploads.length > 0 ? "Complete" : "Pending"}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 ml-8">
                  <div
                    className="h-1.5 rounded-full transition-all duration-300 bg-yellow-600"
                    style={{ 
                      width: isUploading ? `${uploadProgress}%` : imageUploads.length > 0 ? '100%' : '0%' 
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

              {/* Upload History */}
              {(imageUploads.length > 0 || existingImages.length > 0) && (
                <div className="pt-4 border-t">
                  <h4 className="font-sans font-semibold mb-3 text-sm">Thermal Images</h4>
                  <div className="space-y-2">
                    {/* Existing images from database */}
                    {existingImages.map((image) => {
                      // Parse the structured label to extract metadata
                      const labelParts = image.label.split('[')
                      const fileName = labelParts[0]?.trim() || image.label
                      const typeMatch = image.label.match(/\[(baseline|maintenance)\]/)
                      const uploaderMatch = image.label.match(/by (.+)$/)
                      const imageType = typeMatch ? typeMatch[1] : 'unknown'
                      const uploader = uploaderMatch ? uploaderMatch[1] : 'Unknown'
                      
                      return (
                        <div key={image.id} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                          <div className="flex-1">
                            <p className="text-sm font-serif font-medium">{fileName}</p>
                            <p className="text-xs text-muted-foreground font-serif">
                              {imageType} • {uploader} • {new Date(image.captured_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => window.open(image.url, '_blank')}>
                              <Eye className="h-3 w-3" />
                            </Button>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                        </div>
                      )
                    })}
                    {/* Recently uploaded images */}
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
      </div>
    </MainLayout>
  )
}
