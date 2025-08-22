import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

export default function EditTransformerPage() {
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
            <h1 className="text-3xl font-sans font-bold text-foreground">Add/Edit Transformer</h1>
            <p className="text-muted-foreground font-serif">Create or modify transformer records</p>
          </div>
        </div>

        {/* Form */}
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="font-sans">Transformer Details</CardTitle>
            <CardDescription className="font-serif">Enter the transformer information below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transformerId" className="font-serif">
                  Transformer ID
                </Label>
                <Input id="transformerId" placeholder="e.g., AZ-8890" className="font-serif" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="poleNo" className="font-serif">
                  Pole Number
                </Label>
                <Input id="poleNo" placeholder="e.g., EN-123-B" className="font-serif" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="region" className="font-serif">
                  Region
                </Label>
                <Select>
                  <SelectTrigger className="font-serif">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maharagama">Maharagama</SelectItem>
                    <SelectItem value="nugegoda">Nugegoda</SelectItem>
                    <SelectItem value="colombo">Colombo</SelectItem>
                    <SelectItem value="kandy">Kandy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type" className="font-serif">
                  Transformer Type
                </Label>
                <Select>
                  <SelectTrigger className="font-serif">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="distribution">Distribution</SelectItem>
                    <SelectItem value="power">Power</SelectItem>
                    <SelectItem value="instrument">Instrument</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity" className="font-serif">
                  Capacity (kVA)
                </Label>
                <Input id="capacity" type="number" placeholder="e.g., 100" className="font-serif" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feeders" className="font-serif">
                  Number of Feeders
                </Label>
                <Input id="feeders" type="number" placeholder="e.g., 4" className="font-serif" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="font-serif">
                Location Details
              </Label>
              <Textarea
                id="location"
                placeholder="Enter detailed location information..."
                className="font-serif"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button variant="outline" className="font-serif bg-transparent">
                Cancel
              </Button>
              <Button className="font-serif">
                <Save className="mr-2 h-4 w-4" />
                Save Transformer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
