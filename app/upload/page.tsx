"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Upload, ArrowLeft, CheckCircle, Clock, ImageIcon } from "lucide-react"
import backendApi from "@/lib/backend-api"
import { type Transformer, type ImageUpload } from "@/lib/types"

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

export default function AddInspectionPage() {
  const [selectedTransformer, setSelectedTransformer] = useState("")
  const [transformerOptions, setTransformerOptions] = useState<Transformer[]>([])
  const [imageType, setImageType] = useState<"baseline" | "maintenance" | "">("")
  const [uploaderName, setUploaderName] = useState("")
  const [comments, setComments] = useState("")
  const [environmentalCondition, setEnvironmentalCondition] = useState("")
  const [branch, setBranch] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Comparison preview state
  const [showComparison, setShowComparison] = useState(false)
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState<string | null>(null)
  const [baselinePreviewUrl, setBaselinePreviewUrl] = useState<string | null>(null)

  // Recent uploads for display
  const [imageUploads, setImageUploads] = useState<ImageUpload[]>([])

  // Load transformers from backend API
  useEffect(() => {
    let cancelled = false
    const loadTransformers = async () => {
      setLoading(true)
      setError(null)
      try {
        const transformers = await backendApi.transformers.getAll()
        if (!cancelled) {
          setTransformerOptions(transformers)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load transformers')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    loadTransformers()
    return () => {
      cancelled = true
    }
  }, [])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Create object URL for immediate preview
      const url = URL.createObjectURL(file)
      setCurrentPreviewUrl(url)
    }
  }

  // Cleanup object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (currentPreviewUrl) URL.revokeObjectURL(currentPreviewUrl)
    }
  }, [currentPreviewUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedTransformer || !imageType || !uploaderName || !selectedFile || !branch) {
      alert("Please fill in all required fields and select a file")
      return
    }

    if (!environmentalCondition) {
      alert("Please select weather condition")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      // Use backend API to upload image
      const result = await backendApi.upload.uploadImageToBackend(
        selectedFile,
        selectedTransformer,
        imageType as 'baseline' | 'maintenance',
        uploaderName,
        environmentalCondition as 'sunny' | 'cloudy' | 'rainy',
        comments || undefined,
        undefined, // no inspection ID for standalone uploads
        `${selectedFile.name} - ${imageType} by ${uploaderName}`
      )

      // Simulate progress completion
      setUploadProgress(100)
      setUploadComplete(true)

      // Create local upload record for display
      const newUpload: ImageUpload = {
        id: Date.now().toString(),
        transformerId: selectedTransformer,
        fileName: selectedFile.name,
        imageType: imageType as "baseline" | "maintenance",
        uploaderName,
        uploadDateTime: new Date().toISOString(),
        comments: comments || undefined,
        environmentalCondition: environmentalCondition as "sunny" | "cloudy" | "rainy",
        branch,
      }
      setImageUploads((prev) => [...prev, newUpload])

      // Set up comparison when maintenance image is uploaded
      if (imageType === "maintenance") {
        try {
          // Try to get actual baseline image
          const baselineImage = await backendApi.images.getBaselineImage(selectedTransformer)
          setBaselinePreviewUrl(baselineImage ? getImageUrl(baselineImage.url) : "/thermal-baseline-normal.png")
        } catch {
          // Fallback to static image
          setBaselinePreviewUrl("/thermal-baseline-normal.png")
        }
        setShowComparison(true)
      } else {
        setShowComparison(false)
      }

      // Reset form after successful upload
      setTimeout(() => {
        setSelectedTransformer("")
        setImageType("")
        setUploaderName("")
        setComments("")
        setEnvironmentalCondition("")
        setBranch("")
        setSelectedFile(null)
        setUploadProgress(0)
        // Keep uploadComplete and comparison visible briefly
        setTimeout(() => {
          setUploadComplete(false)
          setShowComparison(false)
        }, 3000)
      }, 2000)

    } catch (err) {
      console.error('Upload failed:', err)
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-sans font-bold text-foreground">Add Inspection</h1>
            <p className="text-muted-foreground font-serif">Upload thermal images for transformer inspection</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Form */}
          <Card>
            <CardHeader>
              <CardTitle className="font-sans">Upload Thermal Image</CardTitle>
              <CardDescription className="font-serif">
                Select transformer and upload thermal inspection image
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="transformer" className="font-serif">
                    Transformer *
                  </Label>
                  <Select value={selectedTransformer} onValueChange={setSelectedTransformer}>
                    <SelectTrigger className="font-serif">
                      <SelectValue placeholder="Select transformer" />
                    </SelectTrigger>
                    <SelectContent>
                      {transformerOptions.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.code || t.id} - {t.region || t.location || 'Unknown Location'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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
                  <Label className="font-serif">Upload Date/Time</Label>
                  <Input value={new Date().toLocaleString()} disabled className="font-serif bg-muted" />
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
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <div className="space-y-2">
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
                  ) : uploadComplete ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Upload Complete
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Image
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Upload Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="font-sans">Upload Progress</CardTitle>
              <CardDescription className="font-serif">Track your image upload and processing status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-serif">
                  <span>Thermal Image Upload</span>
                  <span
                    className={`${isUploading ? "text-primary" : uploadComplete ? "text-green-600" : "text-muted-foreground"}`}
                  >
                    {isUploading ? `${uploadProgress}%` : uploadComplete ? "Complete" : "Pending"}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      uploadComplete ? "bg-green-600" : "bg-primary"
                    }`}
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-serif">
                  <span>AI Analysis</span>
                  <span className={`${uploadComplete ? "text-primary" : "text-muted-foreground"}`}>
                    {uploadComplete ? "In Progress" : "Pending"}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`bg-primary h-2 rounded-full ${uploadComplete ? "w-1/3" : "w-0"} transition-all duration-500`}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-serif">
                  <span>Thermal Image Review</span>
                  <span className="text-muted-foreground">Pending</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full w-0"></div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                {uploadComplete ? (
                  <p className="text-sm font-serif text-green-600">
                    ✓ Image uploaded successfully! AI analysis is now processing the thermal data for anomaly detection.
                  </p>
                ) : isUploading ? (
                  <p className="text-sm font-serif text-primary">
                    Uploading thermal image... Please wait while the file is being processed.
                  </p>
                ) : (
                  <p className="text-sm font-serif text-muted-foreground">
                    Upload a thermal image to begin the automated inspection process. The system will analyze the image
                    for temperature anomalies and potential issues.
                  </p>
                )}
              </div>

              {imageUploads.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-sans font-semibold mb-3">Recent Uploads</h4>
                  <div className="space-y-2">
                    {imageUploads.slice(-3).map((upload) => (
                      <div key={upload.id} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                        <div>
                          <p className="text-sm font-serif font-medium">{upload.fileName}</p>
                          <p className="text-xs text-muted-foreground font-serif">
                            {upload.transformerId} • {upload.imageType}
                          </p>
                        </div>
                        <CheckCircle className="h-4 w-4 text-green-600" />
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
