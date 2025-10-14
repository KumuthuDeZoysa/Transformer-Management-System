"use client"

import { useState, useRef } from "react"
import { detectAnomalies, type AnomalyDetectionResponse } from "@/lib/anomaly-api"
import { CanvasAnnotationEditor } from "@/components/canvas-annotation-editor"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, CheckCircle2, XCircle, Sparkles, ZoomIn, ZoomOut, Move, RotateCcw } from "lucide-react"

interface AnomalyViewerProps {
  baselineUrl: string
  maintenanceUrl: string
  inspectionId?: string
  onAnalysisComplete?: () => void
}

// Image controls state for zoom and pan
interface ImageControls {
  scale: number
  translateX: number
  translateY: number
  isDragging: boolean
  dragStartX: number
  dragStartY: number
}

export function AnomalyViewer({ baselineUrl, maintenanceUrl, inspectionId, onAnalysisComplete }: AnomalyViewerProps) {
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [anomalyData, setAnomalyData] = useState<AnomalyDetectionResponse | null>(null)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const [currentBoxes, setCurrentBoxes] = useState<any[]>([]) // Track current bounding boxes in real-time
  const [selectedBoxIndex, setSelectedBoxIndex] = useState<number | undefined>(undefined) // Track which box to select
  
  // Zoom and pan controls for baseline image
  const [baselineControls, setBaselineControls] = useState<ImageControls>({
    scale: 1,
    translateX: 0,
    translateY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
  })
  
  // Zoom and pan controls for maintenance image
  const [maintenanceControls, setMaintenanceControls] = useState<ImageControls>({
    scale: 1,
    translateX: 0,
    translateY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
  })
  
  const baselineImageRef = useRef<HTMLDivElement>(null)
  const maintenanceImageRef = useRef<HTMLDivElement>(null)

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
      if (inspectionId) {
        console.log("📝 [Anomaly API] Including inspection ID:", inspectionId)
      }
      
      const result = await detectAnomalies(maintenanceUrl, inspectionId)
      
      if (result) {
        console.log("✅ [Anomaly API] Response received:")
        console.log("  - Detections count:", result.detections?.length || 0)
        console.log("  - Label:", result.label)
        console.log("  - Boxed image URL:", result.overlayImage)
        console.log("  - Full response:", result)
        
        setAnomalyData(result)
        setHasAnalyzed(true)
        
        // Notify parent component that analysis is complete
        if (onAnalysisComplete) {
          console.log("🔄 [Anomaly Viewer] Notifying parent of analysis completion")
          onAnalysisComplete()
        }
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
  
  // Extract severity from anomaly type
  const extractSeverity = (type: string): { severity: string; category: string } => {
    const lowerType = type.toLowerCase()
    if (lowerType.includes('faulty')) {
      return { severity: 'Critical', category: type.replace(/\(faulty\)/gi, '').trim() }
    } else if (lowerType.includes('potential')) {
      return { severity: 'Warning', category: type.replace(/\(potential\)/gi, '').trim() }
    } else if (lowerType.includes('tiny')) {
      return { severity: 'Uncertain', category: type }
    }
    return { severity: 'Warning', category: type } // Default to Warning instead of Unknown
  }
  
  // Calculate anomaly size in pixels
  const calculateSize = (bbox: number[]): { width: number; height: number; area: number } => {
    const width = bbox[2] || 0
    const height = bbox[3] || 0
    const area = width * height
    return { width, height, area }
  }
  
  // Check if model is uncertain (low confidence)
  const isUncertain = (confidence: number): boolean => {
    return confidence < 0.6
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

  // Image control functions for baseline
  const handleBaselineZoomIn = () => {
    setBaselineControls(prev => ({ ...prev, scale: Math.min(prev.scale + 0.25, 8) }))
  }
  
  const handleBaselineZoomOut = () => {
    setBaselineControls(prev => ({ ...prev, scale: Math.max(prev.scale - 0.25, 0.5) }))
  }
  
  const handleBaselineReset = () => {
    setBaselineControls({
      scale: 1,
      translateX: 0,
      translateY: 0,
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
    })
  }
  
  const handleBaselineMouseDown = (e: React.MouseEvent) => {
    setBaselineControls(prev => ({
      ...prev,
      isDragging: true,
      dragStartX: e.clientX - prev.translateX,
      dragStartY: e.clientY - prev.translateY,
    }))
  }
  
  const handleBaselineMouseMove = (e: React.MouseEvent) => {
    if (baselineControls.isDragging) {
      setBaselineControls(prev => ({
        ...prev,
        translateX: e.clientX - prev.dragStartX,
        translateY: e.clientY - prev.dragStartY,
      }))
    }
  }
  
  const handleBaselineMouseUp = () => {
    setBaselineControls(prev => ({ ...prev, isDragging: false }))
  }

  // Image control functions for maintenance
  const handleMaintenanceZoomIn = () => {
    setMaintenanceControls(prev => ({ ...prev, scale: Math.min(prev.scale + 0.25, 5) }))
  }
  
  const handleMaintenanceZoomOut = () => {
    setMaintenanceControls(prev => ({ ...prev, scale: Math.max(prev.scale - 0.25, 0.5) }))
  }
  
  const handleMaintenanceReset = () => {
    setMaintenanceControls({
      scale: 1,
      translateX: 0,
      translateY: 0,
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
    })
  }
  
  const handleMaintenanceMouseDown = (e: React.MouseEvent) => {
    setMaintenanceControls(prev => ({
      ...prev,
      isDragging: true,
      dragStartX: e.clientX - prev.translateX,
      dragStartY: e.clientY - prev.translateY,
    }))
  }
  
  const handleMaintenanceMouseMove = (e: React.MouseEvent) => {
    if (maintenanceControls.isDragging) {
      setMaintenanceControls(prev => ({
        ...prev,
        translateX: e.clientX - prev.dragStartX,
        translateY: e.clientY - prev.dragStartY,
      }))
    }
  }
  
  const handleMaintenanceMouseUp = () => {
    setMaintenanceControls(prev => ({ ...prev, isDragging: false }))
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

          {/* Side-by-Side Images with Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Baseline Image */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-muted-foreground">Baseline Image (Reference)</h3>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleBaselineZoomIn}
                    title="Zoom In"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleBaselineZoomOut}
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleBaselineReset}
                    title="Reset View"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div 
                ref={baselineImageRef}
                className="relative bg-muted rounded-lg overflow-hidden border"
                style={{ 
                  height: '400px',
                  cursor: baselineControls.isDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={handleBaselineMouseDown}
                onMouseMove={handleBaselineMouseMove}
                onMouseUp={handleBaselineMouseUp}
                onMouseLeave={handleBaselineMouseUp}
              >
                <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1 z-10">
                  <Move className="h-3 w-3" />
                  <span>Click & Drag to Pan • {(baselineControls.scale * 100).toFixed(0)}%</span>
                </div>
                <img
                  src={baselineUrl}
                  alt="Baseline thermal image"
                  className="absolute top-1/2 left-1/2 select-none"
                  style={{
                    transform: `translate(-50%, -50%) translate(${baselineControls.translateX}px, ${baselineControls.translateY}px) scale(${baselineControls.scale})`,
                    transition: baselineControls.isDragging ? 'none' : 'transform 0.2s ease-out',
                    pointerEvents: 'none',
                    maxWidth: '95%',
                    maxHeight: '95%',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg"
                  }}
                  draggable={false}
                />
              </div>
            </div>

            {/* Maintenance Image - Interactive Annotation Editor */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground">
                Maintenance Image (Current)
                {hasAnalyzed && <span className="ml-2 text-xs text-blue-600">• Interactive Annotation</span>}
              </h3>
              
              {!hasAnalyzed ? (
                // Show original image before analysis
                <div 
                  ref={maintenanceImageRef}
                  className="relative bg-muted rounded-lg overflow-hidden border"
                  style={{ 
                    height: '400px',
                    cursor: maintenanceControls.isDragging ? 'grabbing' : 'grab'
                  }}
                  onMouseDown={handleMaintenanceMouseDown}
                  onMouseMove={handleMaintenanceMouseMove}
                  onMouseUp={handleMaintenanceMouseUp}
                  onMouseLeave={handleMaintenanceMouseUp}
                >
                  <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1 z-10">
                    <Move className="h-3 w-3" />
                    <span>Click & Drag to Pan • {(maintenanceControls.scale * 100).toFixed(0)}%</span>
                  </div>
                  <img
                    src={maintenanceUrl}
                    alt="Maintenance thermal image"
                    className="absolute top-1/2 left-1/2 select-none"
                    style={{
                      transform: `translate(-50%, -50%) translate(${maintenanceControls.translateX}px, ${maintenanceControls.translateY}px) scale(${maintenanceControls.scale})`,
                      transition: maintenanceControls.isDragging ? 'none' : 'transform 0.2s ease-out',
                      pointerEvents: 'none',
                      maxWidth: '95%',
                      maxHeight: '95%',
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain'
                    }}
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg"
                    }}
                    draggable={false}
                  />
                  {analyzing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                      <div className="text-center text-white">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p className="text-sm">Analyzing thermal patterns...</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Show interactive annotation editor after analysis
                <div className="h-full">
                  <CanvasAnnotationEditor
                    imageUrl={anomalyData?.originalImage || maintenanceUrl}
                    imageId={inspectionId || 'temp-id'}
                    userId="admin"
                    initialDetections={anomalyData?.detections || []}
                    compact={true}
                    selectedBoxIndex={selectedBoxIndex}
                    onBoxesChange={(boxes) => {
                      // Update current boxes in real-time (without saving to backend)
                      setCurrentBoxes(boxes)
                    }}
                    onSave={(annotations: any) => {
                      console.log('✅ Annotations saved:', annotations)
                      if (onAnalysisComplete) {
                        onAnalysisComplete()
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detection Results */}
      {hasAnalyzed && currentBoxes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-sans">Detected Anomalies</CardTitle>
            <CardDescription className="font-serif">
              Detailed information about detected thermal anomalies with metadata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentBoxes.map((box, index) => {
                const confidenceSeverity = getSeverity(box.confidence || 0)
                const badgeVariant = getBadgeVariant(box.confidence || 0)
                // Use severity from box if available (user-created), otherwise extract from label (AI)
                const { severity, category } = box.severity 
                  ? { severity: box.severity, category: box.label }
                  : extractSeverity(box.label)
                const uncertain = isUncertain(box.confidence || 0)
                const boxNumber = index + 1 // Box number for correlation with canvas
                
                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3 justify-between p-4 rounded-lg transition-colors border-2 ${
                      uncertain 
                        ? 'bg-yellow-50 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-700' 
                        : 'bg-muted/50 border-transparent hover:bg-muted'
                    }`}
                  >
                    {/* Box Number Badge - Clickable */}
                    <div className="flex-shrink-0">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md cursor-pointer hover:scale-110 transition-transform"
                        style={{ 
                          backgroundColor: severity === 'Critical' ? '#ff2b2bff' : 
                                         severity === 'Warning' ? '#fd9207ff' : 
                                         '#fded05ff' 
                        }}
                        onClick={() => {
                          console.log('🎯 Selecting box:', index, boxNumber)
                          setSelectedBoxIndex(index)
                          // Reset after a brief moment so it can be clicked again
                          setTimeout(() => setSelectedBoxIndex(undefined), 100)
                        }}
                        title="Click to select and edit this bounding box"
                      >
                        {boxNumber}
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-2">{/* Priority Level & Source Type */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge 
                          variant={
                            severity === 'Critical' ? 'destructive' : 
                            severity === 'Warning' ? 'default' : 
                            'secondary'
                          }
                          className="font-semibold"
                        >
                          {severity}
                        </Badge>
                        
                        {/* AI vs User Created Badge */}
                        {box.isAI ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            AI Detected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700">
                            👤 User Created
                          </Badge>
                        )}
                        
                        {uncertain && (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Uncertain
                          </Badge>
                        )}
                      </div>

                      {/* Anomaly Label */}
                      <div>
                        <span className="font-semibold text-base">{category}</span>
                      </div>

                      {/* Confidence Score */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Confidence:</span>
                        <Badge variant={badgeVariant} className="font-mono text-xs">
                          {((box.confidence || 0) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Summary Statistics */}
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-semibold mb-3">Detection Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center p-3 bg-muted/30 rounded">
                  <div className="text-2xl font-bold">{currentBoxes.length}</div>
                  <div className="text-muted-foreground">Total Detected</div>
                </div>
                <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded">
                  <div className="text-2xl font-bold text-red-600">
                    {currentBoxes.filter(b => extractSeverity(b.label).severity === 'Critical').length}
                  </div>
                  <div className="text-muted-foreground">Critical</div>
                </div>
                <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 rounded">
                  <div className="text-2xl font-bold text-orange-600">
                    {currentBoxes.filter(b => extractSeverity(b.label).severity === 'Warning').length}
                  </div>
                  <div className="text-muted-foreground">Warnings</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950 rounded">
                  <div className="text-2xl font-bold text-yellow-600">
                    {currentBoxes.filter(b => isUncertain(b.confidence || 0)).length}
                  </div>
                  <div className="text-muted-foreground">Uncertain</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Anomalies Message */}
      {hasAnalyzed && currentBoxes.length === 0 && (
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
