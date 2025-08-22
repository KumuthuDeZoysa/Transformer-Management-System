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
    type: "Power",
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
    type: "Power",
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
    // Find transformer by ID
    const foundTransformer = transformersData.find((t) => t.id === resolvedParams.id)
    setTransformer(foundTransformer || null)

    // Filter images for this transformer
    const transformerImages = mockImages.filter((img) => img.transformerId === resolvedParams.id)
    setImages(transformerImages)
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

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newImage: UploadedImage = {
      id: `img-${Date.now()}`,
      transformerId: resolvedParams.id,
      filename: `thermal-${uploadForm.imageType.toLowerCase()}-${Date.now()}.jpg`,
      imageType: uploadForm.imageType,
      uploader: uploadForm.uploader,
      uploadDate: new Date().toISOString(),
      comments: uploadForm.comments,
      environmentalCondition: uploadForm.imageType === "Baseline" ? uploadForm.environmentalCondition : undefined,
      imageUrl: "/thermal-image-normal.png",
      status: "Normal",
    }

    setImages((prev) => [newImage, ...prev])
    setShowUploadForm(false)
    setUploadForm({
      imageType: "Maintenance",
      uploader: "",
      comments: "",
      environmentalCondition: "Sunny",
    })
  }

  if (!transformer) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-sans font-bold text-foreground mb-2">Transformer Not Found</h2>
            <p className="text-muted-foreground font-serif mb-4">The requested transformer could not be found.</p>
            <Button onClick={() => router.push("/")} className="font-serif">
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
            <Button variant="ghost" onClick={() => router.push("/")} className="font-serif">
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
            <Button variant="outline" className="font-serif bg-transparent">
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

        {/* Image Gallery */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-sans">Thermal Images</CardTitle>
                <CardDescription className="font-serif">
                  Uploaded thermal images for this transformer ({images.length} total)
                </CardDescription>
              </div>
              <Dialog open={showUploadForm} onOpenChange={setShowUploadForm}>
                <DialogTrigger asChild>
                  <Button className="font-serif">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Image
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-sans">Upload Thermal Image</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleUploadSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="file" className="font-serif">
                        Image File
                      </Label>
                      <Input id="file" type="file" accept="image/*" required className="font-serif" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="imageType" className="font-serif">
                        Image Type
                      </Label>
                      <Select
                        value={uploadForm.imageType}
                        onValueChange={(value: "Baseline" | "Maintenance") =>
                          setUploadForm((prev) => ({ ...prev, imageType: value }))
                        }
                      >
                        <SelectTrigger className="font-serif">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Baseline">Baseline</SelectItem>
                          <SelectItem value="Maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {uploadForm.imageType === "Baseline" && (
                      <div className="space-y-2">
                        <Label htmlFor="environmentalCondition" className="font-serif">
                          Environmental Condition
                        </Label>
                        <Select
                          value={uploadForm.environmentalCondition}
                          onValueChange={(value: "Sunny" | "Cloudy" | "Rainy") =>
                            setUploadForm((prev) => ({ ...prev, environmentalCondition: value }))
                          }
                        >
                          <SelectTrigger className="font-serif">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Sunny">Sunny</SelectItem>
                            <SelectItem value="Cloudy">Cloudy</SelectItem>
                            <SelectItem value="Rainy">Rainy</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="uploader" className="font-serif">
                        Uploader Name
                      </Label>
                      <Input
                        id="uploader"
                        value={uploadForm.uploader}
                        onChange={(e) => setUploadForm((prev) => ({ ...prev, uploader: e.target.value }))}
                        required
                        className="font-serif"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="comments" className="font-serif">
                        Comments (Optional)
                      </Label>
                      <Textarea
                        id="comments"
                        value={uploadForm.comments}
                        onChange={(e) => setUploadForm((prev) => ({ ...prev, comments: e.target.value }))}
                        className="font-serif"
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowUploadForm(false)}
                        className="font-serif"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="font-serif">
                        Upload
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-[180px] font-serif">
                  <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Baseline">Baseline</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterUploader} onValueChange={setFilterUploader}>
                <SelectTrigger className="w-full sm:w-[180px] font-serif">
                  <SelectValue placeholder="Filter by Uploader" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Uploaders</SelectItem>
                  {uniqueUploaders.map((uploader) => (
                    <SelectItem key={uploader} value={uploader}>
                      {uploader}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredImages.length === 0 ? (
              <div className="text-center py-12">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-sans font-semibold text-foreground mb-2">No Images Found</h3>
                <p className="text-muted-foreground font-serif mb-4">No thermal images match your current filters.</p>
                <Button onClick={() => setShowUploadForm(true)} className="font-serif">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload First Image
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredImages.map((image) => (
                  <Card key={image.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                    <div className="aspect-square relative bg-muted" onClick={() => setSelectedImage(image)}>
                      <img
                        src={image.imageUrl || "/placeholder.svg"}
                        alt={image.filename}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className={getStatusColor(image.status)} variant="secondary">
                          {image.status}
                        </Badge>
                      </div>
                      <div className="absolute top-2 left-2">
                        <Badge variant="outline" className="bg-background/80">
                          {image.imageType}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <div className="space-y-1">
                        <p className="font-serif font-medium text-sm truncate">{image.filename}</p>
                        <p className="text-xs text-muted-foreground font-serif">By {image.uploader}</p>
                        <p className="text-xs text-muted-foreground font-serif">
                          {new Date(image.uploadDate).toLocaleDateString()}
                        </p>
                        {image.environmentalCondition && (
                          <Badge variant="outline" className="text-xs">
                            {image.environmentalCondition}
                          </Badge>
                        )}
                        {image.comments && (
                          <p className="text-xs text-muted-foreground font-serif truncate" title={image.comments}>
                            {image.comments}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Image Modal */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            {selectedImage && (
              <>
                <DialogHeader>
                  <DialogTitle className="font-sans">{selectedImage.filename}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
                    <img
                      src={selectedImage.imageUrl || "/placeholder.svg"}
                      alt={selectedImage.filename}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-serif font-medium">Type:</p>
                      <p className="text-muted-foreground font-serif">{selectedImage.imageType}</p>
                    </div>
                    <div>
                      <p className="font-serif font-medium">Status:</p>
                      <Badge className={getStatusColor(selectedImage.status)}>{selectedImage.status}</Badge>
                    </div>
                    <div>
                      <p className="font-serif font-medium">Uploader:</p>
                      <p className="text-muted-foreground font-serif">{selectedImage.uploader}</p>
                    </div>
                    <div>
                      <p className="font-serif font-medium">Upload Date:</p>
                      <p className="text-muted-foreground font-serif">
                        {new Date(selectedImage.uploadDate).toLocaleString()}
                      </p>
                    </div>
                    {selectedImage.environmentalCondition && (
                      <div>
                        <p className="font-serif font-medium">Environmental Condition:</p>
                        <p className="text-muted-foreground font-serif">{selectedImage.environmentalCondition}</p>
                      </div>
                    )}
                    {selectedImage.comments && (
                      <div className="col-span-2">
                        <p className="font-serif font-medium">Comments:</p>
                        <p className="text-muted-foreground font-serif">{selectedImage.comments}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
