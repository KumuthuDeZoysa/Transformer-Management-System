"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Save, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Form data interface - basic transformer data without metadata
interface TransformerFormData {
  id: string
  poleNo: string
  region: string
  type: "Distribution" | "Power" | "Bulk"
  capacity: string
  location: string
}

// Full transformer interface with all metadata
interface Transformer {
  id: string
  poleNo: string
  region: string
  type: "Distribution" | "Power" | "Bulk"
  capacity: string
  location: string
  status: "Normal" | "Warning" | "Critical"
  lastInspection: string
  createdAt: string
  updatedAt: string
}

interface TransformerFormProps {
  transformer?: Transformer
  onSubmit: (transformer: TransformerFormData) => void
  onCancel: () => void
  existingTransformers: Transformer[]
}

const regions = [
  "Maharagama",
  "Nugegoda",
  "Colombo",
  "Dehiwala",
  "Mount Lavinia",
  "Ratmalana",
  "Moratuwa",
  "Panadura",
  "Kalutara",
]

const transformerTypes = ["Distribution", "Power", "Bulk"]

export function TransformerForm({ transformer, onSubmit, onCancel, existingTransformers }: TransformerFormProps) {
  const [formData, setFormData] = useState<TransformerFormData>({
    id: "",
    poleNo: "",
    region: "",
    type: "Distribution",
    capacity: "",
    location: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = !!transformer

  useEffect(() => {
    if (transformer) {
      setFormData({
        id: transformer.id,
        poleNo: transformer.poleNo,
        region: transformer.region,
        type: transformer.type,
        capacity: transformer.capacity,
        location: transformer.location,
      })
    }
  }, [transformer])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Required field validation
    if (!formData.id.trim()) {
      newErrors.id = "Transformer No. is required"
    } else if (!isEditing) {
      // Check for uniqueness only when adding new transformer
      const isDuplicate = existingTransformers.some((t) => t.id === formData.id)
      if (isDuplicate) {
        newErrors.id = "Transformer No. must be unique"
      }
    }

    if (!formData.poleNo.trim()) {
      newErrors.poleNo = "Pole No. is required"
    }

    if (!formData.region) {
      newErrors.region = "Region/Branch is required"
    }

    if (!formData.type) {
      newErrors.type = "Type is required"
    }

    if (!formData.capacity.trim()) {
      newErrors.capacity = "Capacity is required"
    } else {
      // Validate capacity format (number + kVA)
      const capacityRegex = /^\d+(\.\d+)?\s*kVA$/i
      if (!capacityRegex.test(formData.capacity)) {
        newErrors.capacity = "Capacity must be in format: '100 kVA'"
      }
    }

    if (!formData.location.trim()) {
      newErrors.location = "Location Details is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      onSubmit(formData)
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof TransformerFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="font-sans">{isEditing ? "Edit Transformer" : "Add New Transformer"}</CardTitle>
        <CardDescription className="font-serif">
          {isEditing ? "Update transformer information" : "Enter transformer details to add to the system"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Transformer No */}
            <div className="space-y-2">
              <Label htmlFor="transformerId" className="font-serif">
                Transformer No. <span className="text-destructive">*</span>
              </Label>
              <Input
                id="transformerId"
                value={formData.id}
                onChange={(e) => handleInputChange("id", e.target.value)}
                placeholder="e.g., AZ-8890"
                className={`font-serif ${errors.id ? "border-destructive" : ""}`}
                disabled={isEditing} // Don't allow editing ID
              />
              {errors.id && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-serif">{errors.id}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Pole No */}
            <div className="space-y-2">
              <Label htmlFor="poleNo" className="font-serif">
                Pole No. <span className="text-destructive">*</span>
              </Label>
              <Input
                id="poleNo"
                value={formData.poleNo}
                onChange={(e) => handleInputChange("poleNo", e.target.value)}
                placeholder="e.g., EN-123-B"
                className={`font-serif ${errors.poleNo ? "border-destructive" : ""}`}
              />
              {errors.poleNo && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-serif">{errors.poleNo}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Region/Branch */}
            <div className="space-y-2">
              <Label htmlFor="region" className="font-serif">
                Region/Branch <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.region} onValueChange={(value) => handleInputChange("region", value)}>
                <SelectTrigger className={`font-serif ${errors.region ? "border-destructive" : ""}`}>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region} className="font-serif">
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.region && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-serif">{errors.region}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type" className="font-serif">
                Type <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                <SelectTrigger className={`font-serif ${errors.type ? "border-destructive" : ""}`}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {transformerTypes.map((type) => (
                    <SelectItem key={type} value={type} className="font-serif">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-serif">{errors.type}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Capacity */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="capacity" className="font-serif">
                Capacity <span className="text-destructive">*</span>
              </Label>
              <Input
                id="capacity"
                value={formData.capacity}
                onChange={(e) => handleInputChange("capacity", e.target.value)}
                placeholder="e.g., 100 kVA"
                className={`font-serif ${errors.capacity ? "border-destructive" : ""}`}
              />
              {errors.capacity && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-serif">{errors.capacity}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Location Details */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="location" className="font-serif">
                Location Details <span className="text-destructive">*</span>
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                placeholder="e.g., Maharagama Junction, Main Road"
                className={`font-serif ${errors.location ? "border-destructive" : ""}`}
              />
              {errors.location && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-serif">{errors.location}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="font-serif bg-transparent"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="font-serif">
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Saving..." : isEditing ? "Update Transformer" : "Add Transformer"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
