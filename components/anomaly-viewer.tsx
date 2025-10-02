"use client"

import { useState } from "react"
import { detectAnomalies, type AnomalyDetectionResponse } from "@/lib/anomaly-api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, CheckCircle2, XCircle, Sparkles } from "lucide-react"

interface AnomalyViewerProps {
  baselineUrl: string
  maintenanceUrl: string
}

export function AnomalyViewer({ baselineUrl, maintenanceUrl }: AnomalyViewerProps) {
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [anomalyData, setAnomalyData] = useState<AnomalyDetectionResponse | null>(null)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)

  // Handle analyze button click
  const handleAnalyze = async () => {
    if (!maintenanceUrl) {
      setError("No maintenance image available")
      return
    }

    setAnalyzing(true)
    setError(null)

    try {
      console.log("🚀 [Anomaly API] Sending request to:", maintenanceUrl)
      const result = await detectAnomalies(maintenanceUrl)
      
      if (result) {
        console.log("✅ [Anomaly API] Response received:")
        console.log("  - Detections count:", result.detections?.length || 0)
        console.log("  - Label:", result.label)
        console.log("  - Boxed image URL:", result.overlayImage)
        console.log("  - Full response:", result)
        
        setAnomalyData(result)
        setHasAnalyzed(true)
      } else {
        setError("Failed to detect anomalies. Please try again.")
      }
    } catch (err) {
      console.error("❌ Error detecting anomalies:", err)
      setError("An error occurred while detecting anomalies.")
    } finally {
      setAnalyzing(false)
    }
  }

  // Get severity based on confidence score
  const getSeverity = (confidence: number): string => {
    if (confidence >= 0.8) return "High"
    if (confidence >= 0.5) return "Medium"
    return "Low"
  }

  // Get badge color based on confidence
  const getBadgeVariant = (confidence: number): "destructive" | "default" | "secondary" => {
    if (confidence >= 0.8) return "destructive"  // Red for high
    if (confidence >= 0.5) return "default"      // Orange/yellow for medium
    return "secondary"                           // Gray for low
  }

  // Get status badge based on label
  const getStatusBadge = (label: string) => {
    const lowerLabel = label?.toLowerCase() || ""
    if (lowerLabel.includes("normal")) {
      return { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100" }
    } else if (lowerLabel.includes("warning") || lowerLabel.includes("potential")) {
      return { icon: AlertCircle, color: "text-yellow-600", bg: "bg-yellow-100" }
    } else if (lowerLabel.includes("critical") || lowerLabel.includes("faulty")) {
      return { icon: XCircle, color: "text-red-600", bg: "bg-red-100" }
    }
    return { icon: AlertCircle, color: "text-blue-600", bg: "bg-blue-100" }
  }

  return (
    <div className="space-y-6">
      {/* Header with Analysis Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-sans">Thermal Image Comparison</CardTitle>
              <CardDescription className="font-serif">
                Compare baseline and maintenance thermal images
              </CardDescription>
            </div>
            {!hasAnalyzed && (
              <Button 
                onClick={handleAnalyze} 
                disabled={analyzing || !maintenanceUrl}
                className="gap-2"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Detect Anomalies
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm font-serif">{error}</p>
              </div>
            </div>
          )}

          {/* Analysis Result Header */}
          {hasAnalyzed && anomalyData && (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                {(() => {
                  const badge = getStatusBadge(anomalyData.label)
                  const Icon = badge.icon
                  return (
                    <>
                      <div className={`p-2 rounded-full ${badge.bg}`}>
                        <Icon className={`h-5 w-5 ${badge.color}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold">Analysis Result: {anomalyData.label}</h3>
                        <p className="text-sm text-muted-foreground">
                          {anomalyData.detections.length === 0
                            ? "No anomalies detected"
                            : `${anomalyData.detections.length} anomaly${anomalyData.detections.length > 1 ? "ies" : ""} detected`}
                        </p>
                      </div>
                    </>
                  )
                })()}
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  LIVE API DATA
                </div>
                <p className="text-xs text-muted-foreground">Hugging Face Model</p>
              </div>
            </div>
          )}

          {/* Side-by-Side Images */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Baseline Image */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground">Baseline Image (Reference)</h3>
              <div className="relative bg-muted rounded-lg overflow-hidden border">
                <img
                  src={baselineUrl}
                  alt="Baseline thermal image"
                  className="w-full h-auto"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg"
                  }}
                />
              </div>
            </div>

            {/* Maintenance Image */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground">
                Maintenance Image (Current)
                {hasAnalyzed && <span className="ml-2 text-xs text-blue-600">• Annotated</span>}
              </h3>
              <div className="relative bg-muted rounded-lg overflow-hidden border">
                <img
                  src={hasAnalyzed && anomalyData ? anomalyData.overlayImage : maintenanceUrl}
                  alt="Maintenance thermal image"
                  className="w-full h-auto"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg"
                  }}
                />
                {analyzing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm">Analyzing thermal patterns...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detection Results */}
      {hasAnalyzed && anomalyData && anomalyData.detections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-sans">Detected Anomalies</CardTitle>
            <CardDescription className="font-serif">
              Detailed information about detected thermal anomalies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {anomalyData.detections.map((detection, index) => {
                const severity = getSeverity(detection.confidence)
                const badgeVariant = getBadgeVariant(detection.confidence)
                
                return (
                  <div
                    key={index}
                    className="flex items-start justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={badgeVariant} className="font-mono">
                          {severity} ({(detection.confidence * 100).toFixed(1)}%)
                        </Badge>
                        <span className="font-semibold">{detection.type}</span>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-4">
                          <span>
                            <strong>Confidence:</strong> {detection.confidence.toFixed(3)} ({(detection.confidence * 100).toFixed(1)}%)
                          </span>
                          <span>
                            <strong>Bbox:</strong> X:{detection.bbox[0]}, Y:{detection.bbox[1]}, W:{detection.bbox[2]}, H:{detection.bbox[3]}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Anomalies Message */}
      {hasAnalyzed && anomalyData && anomalyData.detections.length === 0 && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-100">No Anomalies Detected</h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  The thermal image analysis shows normal operating conditions. No temperature anomalies were found.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
