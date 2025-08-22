"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Eye, Download, ArrowLeft, Upload, X, Calendar, User, MessageSquare, Camera } from "lucide-react"
import Link from "next/link"

const initialImages = [
  {
    id: 1,
    transformerId: "AZ-8890",
    type: "Baseline",
    weather: "Sunny",
    date: "May 21, 2023",
    uploader: "John Smith",
    comments: "Initial baseline capture under optimal conditions",
    status: "Normal",
    thumbnail: "/thermal-image-normal.png",
    fullImage: "/normal-thermal-image.png",
  },
  {
    id: 2,
    transformerId: "AZ-1649",
    type: "Maintenance",
    weather: "Cloudy",
    date: "May 22, 2023",
    uploader: "Sarah Johnson",
    comments: "Routine maintenance check - slight temperature elevation detected",
    status: "Warning",
    thumbnail: "/thermal-image-warning.png",
    fullImage: "/thermal-warning.png",
  },
  {
    id: 3,
    transformerId: "AZ-7316",
    type: "Maintenance",
    weather: "Rainy",
    date: "May 23, 2023",
    uploader: "Mike Chen",
    comments: "Critical hotspot identified in upper section - immediate attention required",
    status: "Critical",
    thumbnail: "/thermal-critical-hotspot.png",
    fullImage: "/thermal-critical-hotspot.png",
  },
  {
    id: 4,
    transformerId: "AZ-4613",
    type: "Baseline",
    weather: "Sunny",
    date: "May 20, 2023",
    uploader: "Lisa Wong",
    comments: "Clean baseline reading, all parameters within normal range",
    status: "Normal",
    thumbnail: "/thermal-image-baseline-normal.png",
    fullImage: "/thermal-baseline-normal.png",
  },
  {
    id: 5,
    transformerId: "AX-8993",
    type: "Maintenance",
    weather: "Cloudy",
    date: "May 19, 2023",
    uploader: "David Kumar",
    comments: "Post-maintenance verification - temperatures normalized",
    status: "Normal",
    thumbnail: "/thermal-maintenance-normal.png",
    fullImage: "/thermal-maintenance-normal.png",
  },
  {
    id: 6,
    transformerId: "AY-8790",
    type: "Baseline",
    weather: "Sunny",
    date: "May 18, 2023",
    uploader: "Emma Rodriguez",
    comments: "Baseline with minor temperature variations - monitoring recommended",
    status: "Warning",
    thumbnail: "/thermal-baseline-warning.png",
    fullImage: "/thermal-baseline-warning.png",
  },
]

const transformerOptions = [
  { id: "AZ-8890", name: "AZ-8890 - Maharagama Distribution" },
  { id: "AZ-1649", name: "AZ-1649 - Nugegoda Bulk" },
  { id: "AZ-7316", name: "AZ-7316 - Colombo Distribution" },
  { id: "AZ-4613", name: "AZ-4613 - Kandy Bulk" },
  { id: "AX-8993", name: "AX-8993 - Galle Distribution" },
  { id: "AY-8790", name: "AY-8790 - Matara Bulk" },
]

export default function GalleryPage() {
  const [images, setImages] = useState(initialImages)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [weatherFilter, setWeatherFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedImage, setSelectedImage] = useState<(typeof initialImages)[0] | null>(null)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    transformerId: "",
    type: "",
    weather: "",
    uploader: "",
    comments: "",
    file: null as File | null,
  })

  const filteredImages = images.filter((image) => {
    const matchesSearch =
      image.transformerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.uploader.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || image.type.toLowerCase() === typeFilter
    const matchesWeather = weatherFilter === "all" || image.weather.toLowerCase() === weatherFilter
    const matchesStatus = statusFilter === "all" || image.status.toLowerCase() === statusFilter

    return matchesSearch && matchesType && matchesWeather && matchesStatus
  })

  const handleUpload = () => {
    if (!uploadForm.transformerId || !uploadForm.type || !uploadForm.uploader || !uploadForm.file) {
      alert("Please fill in all required fields")
      return
    }

    const newImage = {
      id: images.length + 1,
      transformerId: uploadForm.transformerId,
      type: uploadForm.type,
      weather: uploadForm.weather || "Sunny",
      date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      uploader: uploadForm.uploader,
      comments: uploadForm.comments,
      status: "Normal",
      thumbnail: URL.createObjectURL(uploadForm.file),
      fullImage: URL.createObjectURL(uploadForm.file),
    }

    setImages([newImage, ...images])
    setUploadForm({
      transformerId: "",
      type: "",
      weather: "",
      uploader: "",
      comments: "",
      file: null,
    })
    setIsUploadOpen(false)
  }

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
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 font-serif">
                <Upload className="mr-2 h-4 w-4" />
                Upload Image
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-sans">Upload New Image</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="transformer" className="font-serif">
                    Transformer *
                  </Label>
                  <Select
                    value={uploadForm.transformerId}
                    onValueChange={(value) => setUploadForm((prev) => ({ ...prev, transformerId: value }))}
                  >
                    <SelectTrigger className="font-serif">
                      <SelectValue placeholder="Select transformer" />
                    </SelectTrigger>
                    <SelectContent>
                      {transformerOptions.map((transformer) => (
                        <SelectItem key={transformer.id} value={transformer.id}>
                          {transformer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="type" className="font-serif">
                    Image Type *
                  </Label>
                  <Select
                    value={uploadForm.type}
                    onValueChange={(value) => setUploadForm((prev) => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className="font-serif">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Baseline">Baseline</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {uploadForm.type === "Baseline" && (
                  <div>
                    <Label htmlFor="weather" className="font-serif">
                      Environmental Condition
                    </Label>
                    <Select
                      value={uploadForm.weather}
                      onValueChange={(value) => setUploadForm((prev) => ({ ...prev, weather: value }))}
                    >
                      <SelectTrigger className="font-serif">
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sunny">Sunny</SelectItem>
                        <SelectItem value="Cloudy">Cloudy</SelectItem>
                        <SelectItem value="Rainy">Rainy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="uploader" className="font-serif">
                    Uploader Name *
                  </Label>
                  <Input
                    id="uploader"
                    value={uploadForm.uploader}
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, uploader: e.target.value }))}
                    placeholder="Enter your name"
                    className="font-serif"
                  />
                </div>

                <div>
                  <Label htmlFor="file" className="font-serif">
                    Image File *
                  </Label>
                  <Input
                    id="file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }))}
                    className="font-serif"
                  />
                </div>

                <div>
                  <Label htmlFor="comments" className="font-serif">
                    Comments
                  </Label>
                  <Textarea
                    id="comments"
                    value={uploadForm.comments}
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, comments: e.target.value }))}
                    placeholder="Optional comments about the image"
                    className="font-serif"
                  />
                </div>

                <div className="flex space-x-2">
                  <Button onClick={handleUpload} className="flex-1 font-serif">
                    Upload Image
                  </Button>
                  <Button variant="outline" onClick={() => setIsUploadOpen(false)} className="flex-1 font-serif">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
                    <Button variant="outline" size="sm" className="flex-1 font-serif bg-transparent">
                      <Download className="mr-1 h-3 w-3" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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
                    <Button className="font-serif">
                      <Download className="mr-2 h-4 w-4" />
                      Download Full Resolution
                    </Button>
                    <Button variant="outline" className="font-serif bg-transparent">
                      Generate Report
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Load More */}
        {filteredImages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground font-serif">No images found matching your criteria.</p>
          </div>
        ) : (
          <div className="text-center">
            <Button variant="outline" className="font-serif bg-transparent">
              Load More Images ({filteredImages.length} of {images.length} shown)
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
