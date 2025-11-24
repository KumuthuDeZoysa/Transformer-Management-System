"use client"

import { useState, useRef, useEffect } from "react"
import { detectAnomalies, type AnomalyDetectionResponse } from "@/lib/anomaly-api"
import { saveAnnotationsRealtime, getInspectionAnnotations } from "@/lib/annotation-api"
import { useFeedbackLog } from "@/hooks/use-feedback-log"
import { authApi } from "@/lib/auth-api"
import type { ModelPredictions, FinalAnnotations, DetectionAnnotation } from "@/lib/types"
import { CanvasAnnotationEditor } from "@/components/canvas-annotation-editor"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, CheckCircle2, XCircle, Sparkles, ZoomIn, ZoomOut, Move, RotateCcw, Database, Save, StickyNote } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

interface AnomalyViewerProps {
  baselineUrl: string
  maintenanceUrl: string
  inspectionId?: string
  transformerId?: string
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

export function AnomalyViewer({ baselineUrl, maintenanceUrl, inspectionId, transformerId, onAnalysisComplete }: AnomalyViewerProps) {
  // Log props on mount
  useEffect(() => {
    console.log('🎯 [AnomalyViewer Mount] Props received:', {
      inspectionId,
      transformerId,
      hasBaselineUrl: !!baselineUrl,
      hasMaintenanceUrl: !!maintenanceUrl,
      inspectionIdType: typeof inspectionId,
      inspectionIdValue: inspectionId
    })
  }, [])
  
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [anomalyData, setAnomalyData] = useState<AnomalyDetectionResponse | null>(null)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const [currentBoxes, setCurrentBoxes] = useState<any[]>([]) // Track current bounding boxes in real-time
  const [deletedBoxes, setDeletedBoxes] = useState<any[]>([]) // Track deleted bounding boxes
  const [selectedBoxIndex, setSelectedBoxIndex] = useState<number | undefined>(undefined) // Track which box to select
  const [currentUser, setCurrentUser] = useState<{ username: string } | null>(null)
  const [isLoadingAnnotations, setIsLoadingAnnotations] = useState(false)
  const [isSavingAnnotations, setIsSavingAnnotations] = useState(false)
  const [hasLoadedPrevious, setHasLoadedPrevious] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [initialModelPredictions, setInitialModelPredictions] = useState<ModelPredictions | null>(null) // Store AI predictions for feedback logging
  const [annotationStartTime, setAnnotationStartTime] = useState<number>(Date.now()) // Track time spent
  // Local UI state for notes editor visibility/content per box
  const [noteEditor, setNoteEditor] = useState<{ [id: string]: { open: boolean; value: string } }>({})
  // Bump version when pushing external note update to canvas
  const [noteUpdateVersion, setNoteUpdateVersion] = useState(0)
  const [lastNoteUpdate, setLastNoteUpdate] = useState<{ id: string; note: string; version: number } | undefined>(undefined)
  
  // Initialize feedback logging hook
  const { submitFeedback, loading: feedbackLoading } = useFeedbackLog({
    onSuccess: (id) => console.log('✅ [Feedback] Logged successfully:', id),
    onError: (error) => console.error('❌ [Feedback] Failed to log:', error)
  })
  
  // Debug: Log when hasUnsavedChanges state changes
  useEffect(() => {
    console.log('🔄 [State Change] hasUnsavedChanges =', hasUnsavedChanges)
  }, [hasUnsavedChanges])
  
  // Fetch current user on component mount
  useEffect(() => {
    if (authApi.isAuthenticated()) {
      const user = authApi.getCurrentUserLocal();
      setCurrentUser(user);
    } else {
      setCurrentUser(null);
    }
  }, [])
  
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

  // Handle manual save button click
  const handleSaveChanges = async () => {
    // Use logged-in user or "Guest" if not authenticated
    const username = currentUser?.username || 'Guest'
    
    console.log('💾 [Save Button Click] Checking prerequisites:', {
      inspectionId,
      currentUser,
      username,
      inspectionIdType: typeof inspectionId,
      inspectionIdValue: inspectionId,
      currentUserValue: currentUser
    })
    
    if (!inspectionId) {
      const errorMsg = 'Cannot save: Missing inspection ID'
      console.error('❌ [Save Validation Failed]', errorMsg)
      setError(errorMsg)
      return
    }

    setIsSavingAnnotations(true)
    setError(null)
    console.log('💾 [Manual Save] Saving all annotations to database:', {
      imageId: inspectionId,
      transformerId: transformerId || 'N/A',
      userId: username,
      activeBoxes: currentBoxes.length,
      deletedBoxes: deletedBoxes.length
    })

    try {
      // Step 1: Save annotations to database (existing functionality)
      const result = await saveAnnotationsRealtime(
        inspectionId,
        username,
        transformerId,
        currentBoxes,
        deletedBoxes
      )
      
      if (result && result.annotations) {
        console.log('✅ [Manual Save] Successfully saved', result.count, 'annotations')
        console.log('🔄 [Manual Save] Syncing backend UUIDs to frontend state')
        
        // Update frontend boxes with backend-generated UUIDs
        const updatedBoxes = currentBoxes.map((box, index) => {
          const savedAnnotation = result.annotations?.[index]
          if (savedAnnotation?.id) {
            console.log(`  → Box #${index + 1}: ${box.id} → ${savedAnnotation.id}`)
            return {
              ...box,
              id: savedAnnotation.id // Replace temp ID with backend UUID
            }
          }
          return box
        })
        
        setCurrentBoxes(updatedBoxes)
        setHasUnsavedChanges(false)
        
        // Step 2: Log feedback for model improvement (new functionality)
        if (initialModelPredictions && initialModelPredictions.detections.length > 0) {
          console.log('📊 [Feedback] Logging feedback for model improvement...')
          
          // Calculate user modifications
          const added = currentBoxes.filter(b => b.action === 'added' && !b.isAI).length
          const edited = currentBoxes.filter(b => b.action === 'edited').length
          const confirmed = currentBoxes.filter(b => b.action === 'confirmed' && b.isAI).length
          const deleted = deletedBoxes.length
          
          // Prepare final annotations
          const finalAnnotations: FinalAnnotations = {
            detections: updatedBoxes.map(box => ({
              id: box.id,
              x: box.x,
              y: box.y,
              width: box.width,
              height: box.height,
              label: box.label,
              type: box.label,
              confidence: box.confidence || 1.0,
              severity: box.severity,
              action: box.action,
              annotationType: box.isAI ? 'AI_GENERATED' : 'USER_CREATED',
              isAI: box.isAI,
              notes: box.notes,
              modificationTypes: box.modificationTypes,
              modificationDetails: box.modificationDetails,
              timestamp: box.timestamp,
              color: box.color
            })),
            label: anomalyData?.label || 'Unknown',
            detectionCount: updatedBoxes.length,
            userModifications: { added, edited, deleted, confirmed },
            metadata: {
              totalChanges: added + edited + deleted,
              timeSpentSeconds: Math.floor((Date.now() - annotationStartTime) / 1000)
            }
          }
          
          // Prepare annotator metadata
          const annotatorMetadata = {
            annotator_id: currentUser?.username || 'Guest',
            annotator_name: currentUser?.username || 'Guest',
            user_id: username,
            username: username,
            timestamp: new Date().toISOString(),
            changes_made: added + edited + deleted,
            time_spent_seconds: finalAnnotations.metadata?.timeSpentSeconds || 0,
            notes: `Saved ${updatedBoxes.length} annotations (${added} added, ${edited} edited, ${deleted} deleted, ${confirmed} confirmed)`
          }
          
          // Submit feedback log
          await submitFeedback(
            inspectionId,
            initialModelPredictions,
            finalAnnotations,
            annotatorMetadata
          )
          
          console.log('✅ [Feedback] Feedback logged successfully')
        } else {
          console.log('ℹ️ [Feedback] Skipping feedback logging (no initial AI predictions)')
        }
        
        // Show success message briefly
        const successMsg = `✅ Saved ${result.count} annotation${result.count !== 1 ? 's' : ''} successfully`
        setError(successMsg)
        setTimeout(() => setError(null), 3000)
      } else {
        setError('⚠️ Failed to save annotations. Please try again.')
      }
    } catch (error) {
      console.error('❌ [Manual Save] Failed to save annotations:', error)
      setError('❌ Error saving annotations. Please try again.')
    } finally {
      setIsSavingAnnotations(false)
    }
  }

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
        
        // Convert AI detections to BoundingBox format (but don't save yet)
        if (result.detections && result.detections.length > 0) {
          console.log('🤖 [AI Detections] Converting AI detections to bounding boxes...')
          
          const baseTimestamp = Date.now()
          const aiBoxes = result.detections.map((detection: any, index: number) => {
            const { severity } = extractSeverity(detection.type || detection.label)
            // Add index to timestamp to ensure unique, ordered timestamps
            const timestamp = new Date(baseTimestamp + index).toISOString()
            return {
              id: `ai-${baseTimestamp}-${index}`,
              x: detection.bbox[0],
              y: detection.bbox[1],
              width: detection.bbox[2],
              height: detection.bbox[3],
              label: detection.type || detection.label,
              confidence: detection.confidence || 0.5,
              severity: severity,
              color: severity === 'Critical' ? '#ef4444' : severity === 'Warning' ? '#f59e0b' : '#eab308',
              action: 'added',
              isAI: true,
              timestamp: timestamp,
              userId: 'AI',
              notes: 'AI-generated detection',
              lastModified: timestamp,
              modificationTypes: ['created'],
              modificationDetails: 'AI Detection'
            }
          })
          
          // Store initial model predictions for feedback logging
          const modelPredictions: ModelPredictions = {
            detections: aiBoxes.map(box => ({
              x: box.x,
              y: box.y,
              width: box.width,
              height: box.height,
              label: box.label,
              type: box.label,
              confidence: box.confidence,
              severity: box.severity as 'Critical' | 'Warning' | 'Uncertain',
              isAI: true,
              action: 'confirmed',
              annotationType: 'AI_GENERATED',
              color: box.color,
              timestamp: box.timestamp
            })),
            label: result.label,
            confidence: result.detections.reduce((sum, d) => sum + (d.confidence || 0), 0) / result.detections.length,
            detectionCount: result.detections.length,
            metadata: {
              modelVersion: 'v1.0',
              processingTime: 0, // Could be tracked if needed
              imageUrl: maintenanceUrl
            }
          }
          
          setInitialModelPredictions(modelPredictions)
          setAnnotationStartTime(Date.now()) // Reset timer when AI detections load
          console.log('📊 [Feedback] Stored initial model predictions for feedback logging')
          
          // Update currentBoxes so they appear in the UI (but not saved to DB yet)
          setCurrentBoxes(aiBoxes)
          setHasUnsavedChanges(true) // Mark as having unsaved changes
          console.log('✅ [AI Detections] Loaded', aiBoxes.length, 'AI detections (not saved yet - click Save Changes)')
        }
        
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

  // Handle loading previous detections from backend
  const handleLoadPrevious = async () => {
    if (!inspectionId) {
      setError("No inspection ID available")
      return
    }

    setIsLoadingAnnotations(true)
    setError(null)

    try {
      const annotations = await getInspectionAnnotations(inspectionId)
      
      if (annotations && annotations.length > 0) {
        console.log('📋 [Load Previous] Raw annotations from backend:', annotations.length)
        
        // Separate active and deleted annotations
        const active = annotations.filter((a: any) => a.action !== 'deleted')
        const deleted = annotations.filter((a: any) => a.action === 'deleted')
        
        // Sort annotations by timestamp to maintain consistent ordering
        // Primary sort: timestamp (earliest first)
        // Secondary sort: id (for annotations created at same time)
        active.sort((a: any, b: any) => {
          const timeA = new Date(a.timestamp || a.lastModified || 0).getTime()
          const timeB = new Date(b.timestamp || b.lastModified || 0).getTime()
          if (timeA !== timeB) return timeA - timeB
          // If timestamps are equal, sort by ID for consistency
          return (a.id || '').localeCompare(b.id || '')
        })
        
        console.log('📋 [Load Previous] Sorted active annotations:', active.map((a: any, i: number) => 
          `#${i + 1}: ${a.label} (timestamp: ${a.timestamp})`
        ))
        
        deleted.sort((a: any, b: any) => {
          const timeA = new Date(a.timestamp || a.lastModified || 0).getTime()
          const timeB = new Date(b.timestamp || b.lastModified || 0).getTime()
          if (timeA !== timeB) return timeA - timeB
          return (a.id || '').localeCompare(b.id || '')
        })
        
        // Convert AnnotationDTO to BoundingBox format
        const activeBoxes = active.map((a: any) => ({
          id: a.id || `user-${Date.now()}-${Math.random()}`,
          x: a.x,
          y: a.y,
          width: a.width,
          height: a.height,
          label: a.label,
          confidence: a.confidence,
          severity: a.severity,
          color: a.severity === 'Critical' ? '#ef4444' : a.severity === 'Warning' ? '#f59e0b' : '#eab308',
          action: a.action,
          isAI: a.isAI,
          timestamp: a.timestamp,
          userId: a.userId,
          notes: a.notes,
          lastModified: a.lastModified,
          modificationTypes: a.modificationTypes || [],
          modificationDetails: a.modificationDetails
        }))
        
        const deletedBoxes = deleted.map((a: any) => ({
          id: a.id || `user-${Date.now()}-${Math.random()}`,
          x: a.x,
          y: a.y,
          width: a.width,
          height: a.height,
          label: a.label,
          confidence: a.confidence,
          severity: a.severity,
          color: a.severity === 'Critical' ? '#ef4444' : a.severity === 'Warning' ? '#f59e0b' : '#eab308',
          action: 'deleted',
          isAI: a.isAI,
          timestamp: a.timestamp,
          userId: a.userId,
          notes: a.notes,
          lastModified: a.lastModified,
          modificationTypes: a.modificationTypes || [],
          modificationDetails: a.modificationDetails
        }))
        
        setCurrentBoxes(activeBoxes)
        setDeletedBoxes(deletedBoxes)
        setHasLoadedPrevious(true)
        setHasAnalyzed(true)
        setHasUnsavedChanges(false)
        
        // Create a synthetic anomalyData object so the canvas displays the loaded boxes
        // Include ALL boxes (active + deleted) so they can be properly displayed
        const allBoxesForDisplay = [...activeBoxes, ...deletedBoxes]
        const syntheticDetections = allBoxesForDisplay.map((box: any) => ({
          bbox: [box.x, box.y, box.width, box.height],
          type: box.label,
          confidence: box.confidence || 1.0,
          // Include ALL metadata to preserve in canvas
          severity: box.severity,
          action: box.action,
          isAI: box.isAI,
          userId: box.userId,
          notes: box.notes,
          id: box.id,
          timestamp: box.timestamp,
          lastModified: box.lastModified,
          modificationTypes: box.modificationTypes,
          modificationDetails: box.modificationDetails
        }))
        
        setAnomalyData({
          label: allBoxesForDisplay.length > 0 ? 'Previous Detections' : 'No Anomalies',
          detections: syntheticDetections,
          overlayImage: maintenanceUrl,
          originalImage: maintenanceUrl,
          heatmapImage: maintenanceUrl,
          maskImage: maintenanceUrl
        })
      } else {
        setError('No previous detections found for this inspection.')
      }
    } catch (err) {
      console.error('Failed to load annotations:', err)
      setError('Failed to load previous detections. Please try again.')
    } finally {
      setIsLoadingAnnotations(false)
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
              <div className="flex gap-3">
                <Button 
                  onClick={handleAnalyze} 
                  disabled={analyzing || !maintenanceUrl || isLoadingAnnotations}
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
                
                <Button 
                  onClick={handleLoadPrevious} 
                  disabled={isLoadingAnnotations || analyzing || !inspectionId}
                  variant="outline"
                  className="gap-2"
                >
                  {isLoadingAnnotations ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4" />
                      Load Previous Detections
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error/Success Message */}
          {error && (
            <div className={`p-4 border rounded-lg ${
              error.startsWith('✅') 
                ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
            }`}>
              <div className={`flex items-center gap-2 ${
                error.startsWith('✅') 
                  ? 'text-green-800 dark:text-green-200' 
                  : 'text-red-800 dark:text-red-200'
              }`}>
                {error.startsWith('✅') ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <p className="text-sm font-serif">{error}</p>
              </div>
            </div>
          )}

          {/* Analysis Result Header */}
          {hasAnalyzed && (
            <>
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  {hasLoadedPrevious ? (
                    <>
                      <div className="p-2 rounded-full bg-blue-100">
                        <Database className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Previous Detections Loaded</h3>
                        <p className="text-sm text-muted-foreground">
                          {currentBoxes.length === 0
                            ? "No saved annotations found"
                            : `${currentBoxes.length} annotation${currentBoxes.length > 1 ? "s" : ""} loaded from database`}
                        </p>
                      </div>
                    </>
                  ) : anomalyData ? (
                    <>
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
                    </>
                  ) : null}
                </div>
                {anomalyData && (
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                      LIVE API DATA
                    </div>
                    <p className="text-xs text-muted-foreground">Hugging Face Model</p>
                  </div>
                )}
              </div>

              {/* Save and Load Buttons */}
              <div className="flex items-center justify-end gap-3">
                <Button 
                  onClick={handleLoadPrevious} 
                  disabled={isLoadingAnnotations || analyzing || !inspectionId}
                  variant="outline"
                  className="gap-2"
                >
                  {isLoadingAnnotations ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4" />
                      Load Previous Detections
                    </>
                  )}
                </Button>

                <Button 
                  onClick={handleSaveChanges} 
                  disabled={isSavingAnnotations}
                  className="gap-2"
                  variant={hasUnsavedChanges ? "default" : "secondary"}
                >
                  {isSavingAnnotations ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {hasUnsavedChanges ? "Save Changes" : "Saved"}
                    </>
                  )}
                </Button>
              </div>
            </>
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
                    userId={currentUser?.username || 'Guest'}
                    initialDetections={anomalyData?.detections || []}
                    compact={true}
                    selectedBoxIndex={selectedBoxIndex}
                    externalNoteUpdate={lastNoteUpdate}
                    onBoxesChange={(boxes, deleted) => {
                      // Update current boxes and deleted boxes in real-time
                      console.log('📝 [Boxes Changed]', {
                        activeBoxes: boxes.length,
                        deletedBoxes: deleted.length,
                        settingUnsavedChanges: true
                      })
                      setCurrentBoxes(boxes)
                      setDeletedBoxes(deleted)
                      setHasUnsavedChanges(true) // Mark as having unsaved changes
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
            <CardTitle className="font-sans flex items-center justify-between">
              <span>Detected Anomalies</span>
              {isSavingAnnotations && (
                <Badge variant="outline" className="ml-2 font-normal">
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Saving...
                </Badge>
              )}
              {isLoadingAnnotations && (
                <Badge variant="outline" className="ml-2 font-normal">
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Loading...
                </Badge>
              )}
            </CardTitle>
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
                
                // Check if the box has been edited
                const isEdited = box.action === 'edited'
                const isAdded = box.action === 'added'
                
                // Format timestamp
                const formatTimestamp = (timestamp?: string) => {
                  if (!timestamp) return 'N/A'
                  const date = new Date(timestamp)
                  return date.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                }
                
                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3 justify-between p-4 rounded-lg transition-all border-2 ${
                      isEdited 
                        ? 'bg-blue-50 border-blue-400 dark:bg-blue-950 dark:border-blue-600 shadow-md' 
                        : uncertain 
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
                    
                    <div className="flex-1 space-y-2">
                      {/* Action Type Badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Action Status */}
                        {isEdited && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-400 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-600 font-semibold">
                            ✏️ EDITED
                          </Badge>
                        )}
                        {isAdded && (
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-400 dark:bg-green-900 dark:text-green-200 dark:border-green-600 font-semibold">
                            ➕ ADDED
                          </Badge>
                        )}
                        {box.action === 'confirmed' && (
                          <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-400 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-600">
                            ✓ Confirmed
                          </Badge>
                        )}
                      </div>
                      
                      {/* Priority Level & Source Type */}
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

                      {/* Add Note button and editor */}
                      <div className="pt-2">
                        {/* Show saved notes if they exist and editor is closed */}
                        {box.notes && !noteEditor[box.id]?.open && (
                          <div className="mb-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className="font-semibold text-xs text-blue-900 dark:text-blue-100">Additional Note:</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => {
                                  setNoteEditor(prev => ({
                                    ...prev,
                                    [box.id]: { open: true, value: box.notes || '' }
                                  }))
                                }}
                              >
                                Edit
                              </Button>
                            </div>
                            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                              {box.notes.split('\n').filter((line: string) => line.trim()).map((line: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                                  <span className="flex-1">{line.trim()}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1"
                          onClick={() => {
                            setNoteEditor(prev => ({
                              ...prev,
                              [box.id]: { open: !prev[box.id]?.open, value: prev[box.id]?.value ?? (box.notes || '') }
                            }))
                          }}
                        >
                          <StickyNote className="h-3.5 w-3.5" />
                          {noteEditor[box.id]?.open ? 'Hide Note' : (box.notes ? 'Edit Note' : 'Add Note')}
                        </Button>
                        {noteEditor[box.id]?.open && (
                          <div className="mt-2 space-y-2 p-3 bg-muted/50 border rounded-md">
                            <Textarea
                              placeholder="Type additional notes (one per line for bullet points)..."
                              value={noteEditor[box.id]?.value ?? ''}
                              onChange={(e) =>
                                setNoteEditor(prev => ({
                                  ...prev,
                                  [box.id]: { open: true, value: e.target.value }
                                }))
                              }
                              rows={3}
                              className="resize-none"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  const value = noteEditor[box.id]?.value ?? ''
                                  // Update local boxes so the list reflects immediately
                                  setCurrentBoxes(prev => prev.map(b => (b.id === box.id ? { ...b, notes: value, lastModified: new Date().toISOString(), userId: currentUser?.username || 'Guest' } : b)))
                                  setHasUnsavedChanges(true)
                                  // Push update to canvas
                                  const version = noteUpdateVersion + 1
                                  setNoteUpdateVersion(version)
                                  setLastNoteUpdate({ id: box.id, note: value, version })
                                  // Close the editor after saving
                                  setNoteEditor(prev => ({ ...prev, [box.id]: { open: false, value } }))
                                }}
                              >
                                Save Note
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setNoteEditor(prev => ({ ...prev, [box.id]: { open: false, value: prev[box.id]?.value ?? '' } }))}
                              >
                                Close
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Timestamp and User Info */}
                      <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-muted">
                        {/* Show Modified info (prefer lastModified over timestamp) */}
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Modified by:</span>
                          <span className="text-blue-600 dark:text-blue-400">
                            {box.userId || (box.isAI ? 'AI System' : 'Unknown User')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Modified:</span>
                          <span>{formatTimestamp(box.lastModified || box.timestamp)}</span>
                        </div>
                        {box.modificationDetails && (
                          <div className="flex items-start gap-2 pt-1 bg-blue-50 dark:bg-blue-950 px-2 py-1 rounded">
                            <span className="font-semibold">Change:</span>
                            <span className="italic text-blue-700 dark:text-blue-300">{box.modificationDetails}</span>
                          </div>
                        )}
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

      {/* Deleted Anomalies Section */}
      {hasAnalyzed && deletedBoxes.length > 0 && (
        <Card className="border-red-200 bg-red-50/30 dark:bg-red-950/30 dark:border-red-800">
          <CardHeader>
            <CardTitle className="font-sans text-red-900 dark:text-red-100">Deleted Anomalies</CardTitle>
            <CardDescription className="font-serif">
              Anomalies that have been removed from the inspection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deletedBoxes.map((box, index) => {
                const { severity, category } = box.severity 
                  ? { severity: box.severity, category: box.label }
                  : extractSeverity(box.label)
                
                // Format timestamp
                const formatTimestamp = (timestamp?: string) => {
                  if (!timestamp) return 'N/A'
                  const date = new Date(timestamp)
                  return date.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                }
                
                return (
                  <div
                    key={`deleted-${index}`}
                    className="flex items-start gap-3 justify-between p-4 rounded-lg bg-red-100 dark:bg-red-900/50 border-2 border-red-300 dark:border-red-700 opacity-75"
                  >
                    {/* Deleted Icon */}
                    <div className="flex-shrink-0">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md bg-gray-500"
                        title="Deleted anomaly"
                      >
                        <XCircle className="h-6 w-6" />
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      {/* Deleted Badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-400 dark:bg-red-900 dark:text-red-200 dark:border-red-600 font-semibold">
                          🗑️ DELETED
                        </Badge>
                        
                        {/* Priority Level */}
                        <Badge 
                          variant={
                            severity === 'Critical' ? 'destructive' : 
                            severity === 'Warning' ? 'default' : 
                            'secondary'
                          }
                          className="opacity-60"
                        >
                          {severity}
                        </Badge>
                        
                        {/* AI vs User Created Badge */}
                        {box.isAI ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700 flex items-center gap-1 opacity-60">
                            <Sparkles className="h-3 w-3" />
                            AI Detected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700 opacity-60">
                            👤 User Created
                          </Badge>
                        )}
                      </div>

                      {/* Anomaly Label */}
                      <div>
                        <span className="font-semibold text-base line-through">{category}</span>
                      </div>

                      {/* Show saved notes if they exist (read-only for deleted anomalies) */}
                      {box.notes && (
                        <div className="pt-2">
                          <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md opacity-75">
                            <div className="mb-1">
                              <span className="font-semibold text-xs text-red-900 dark:text-red-100">Additional Note:</span>
                            </div>
                            <ul className="space-y-1 text-sm text-red-800 dark:text-red-200">
                              {box.notes.split('\n').filter((line: string) => line.trim()).map((line: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-red-600 dark:text-red-400 mt-0.5">•</span>
                                  <span className="flex-1">{line.trim()}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Deletion Info */}
                      <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-red-300 dark:border-red-700">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Deleted by:</span>
                          <span className="text-red-700 dark:text-red-300">
                            {box.userId || 'Unknown User'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Deleted:</span>
                          <span>{formatTimestamp(box.lastModified || box.timestamp)}</span>
                        </div>
                        {box.modificationDetails && (
                          <div className="flex items-start gap-2 pt-1 bg-red-200 dark:bg-red-900 px-2 py-1 rounded">
                            <span className="font-semibold">Reason:</span>
                            <span className="italic text-red-800 dark:text-red-200">{box.modificationDetails}</span>
                          </div>
                        )}
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
      {hasAnalyzed && currentBoxes.length === 0 && deletedBoxes.length === 0 && (
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
