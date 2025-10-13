"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { saveAnnotations, type AnnotationDTO } from "@/lib/annotation-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Save, 
  Trash2, 
  Square,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from "lucide-react"

interface BoundingBox {
  id: string
  x: number
  y: number
  width: number
  height: number
  label: string
  confidence?: number
  color: string
  action: 'added' | 'edited' | 'deleted' | 'confirmed'
  isAI?: boolean
}

interface CanvasAnnotationEditorProps {
  imageUrl: string
  imageId: string
  userId?: string
  initialDetections?: Array<{
    bbox: number[]
    type: string
    confidence: number
  }>
  onSave?: (annotations: AnnotationDTO[]) => void
  compact?: boolean
}

export function CanvasAnnotationEditor({
  imageUrl,
  imageId,
  userId = 'admin',
  initialDetections = [],
  onSave,
  compact = false
}: CanvasAnnotationEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastMousePos = useRef({ x: 0, y: 0 })
  const [boxes, setBoxes] = useState<BoundingBox[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [currentLabel, setCurrentLabel] = useState("Unknown")
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [history, setHistory] = useState<BoundingBox[][]>([])
  const [historyStep, setHistoryStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [imageSize, setImageSize] = useState({ width: 800, height: 600 })

  // Load image
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = imageUrl
    img.onload = () => {
      setImage(img)
      setImageSize({ width: img.width, height: img.height })
      // Fit to container and save initial scale
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth
        const containerHeight = compact ? 400 : 600
        const scaleX = containerWidth / img.width
        const scaleY = containerHeight / img.height
        const fitScale = Math.min(scaleX, scaleY, 1)
        setScale(fitScale)
        setInitialScale(fitScale) // Save for reset button
      }
    }
    img.onerror = () => {
      console.error("Failed to load image:", imageUrl)
    }
  }, [imageUrl, compact])

  // Convert initial detections to bounding boxes
  useEffect(() => {
    if (initialDetections.length > 0 && boxes.length === 0) {
      const initialBoxes: BoundingBox[] = initialDetections.map((det, index) => ({
        id: `ai-${index}`,
        x: det.bbox[0],
        y: det.bbox[1],
        width: det.bbox[2],
        height: det.bbox[3],
        label: det.type,
        confidence: det.confidence,
        color: getColorBySeverity(det.type, det.confidence),
        action: 'confirmed' as const,
        isAI: true
      }))
      setBoxes(initialBoxes)
      setHistory([initialBoxes])
      setHistoryStep(0)
    }
  }, [initialDetections, boxes.length])

  // Get color based on anomaly severity/type
  const getColorBySeverity = (label: string, confidence?: number): string => {
    const labelLower = label.toLowerCase()
    
    // Critical anomalies - Red
    if (labelLower.includes('crack') || 
        labelLower.includes('damage') || 
        labelLower.includes('severe') ||
        labelLower.includes('critical') ||
        labelLower.includes('fire') ||
        labelLower.includes('leak')) {
      return '#ef4444' // Red
    }
    
    // Major anomalies - Orange
    if (labelLower.includes('corrosion') || 
        labelLower.includes('rust') || 
        labelLower.includes('moderate') ||
        labelLower.includes('major') ||
        labelLower.includes('wear')) {
      return '#f59e0b' // Orange
    }
    
    // Minor anomalies - Yellow
    if (labelLower.includes('minor') || 
        labelLower.includes('dirt') || 
        labelLower.includes('dust') ||
        labelLower.includes('discolor')) {
      return '#eab308' // Yellow
    }
    
    // Use confidence as fallback
    if (confidence !== undefined) {
      if (confidence >= 0.8) return '#ef4444' // Red - High confidence
      if (confidence >= 0.5) return '#f59e0b' // Orange - Medium confidence
      return '#eab308' // Yellow - Low confidence
    }
    
    // Default - Blue for user-added or unknown
    return '#3b82f6' // Blue
  }

  // Draw canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Save context for image
    ctx.save()

    // Apply transformations only for the image
    ctx.translate(offset.x, offset.y)
    ctx.scale(scale, scale)

    // Draw image (scaled)
    ctx.drawImage(image, 0, 0, imageSize.width, imageSize.height)

    // Restore context (remove scale) before drawing boxes
    ctx.restore()

    // Draw bounding boxes (not scaled - fixed size)
    boxes.forEach(box => {
      const isSelected = box.id === selectedId

      // Calculate scaled box coordinates (where the box appears on scaled image)
      const scaledX = box.x * scale + offset.x
      const scaledY = box.y * scale + offset.y
      const scaledWidth = box.width * scale
      const scaledHeight = box.height * scale

      // Draw rectangle with shadow for better visibility (fixed line width)
      ctx.strokeStyle = box.color
      ctx.lineWidth = isSelected ? 3 : 2  // Fixed width, not scaled
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowBlur = 6
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight)
      ctx.shadowBlur = 0

      // Prepare label text (fixed size)
      const labelText = `${box.label} ${box.confidence ? `(${Math.round(box.confidence * 100)}%)` : ''}`
      
      // Calculate font size (fixed size, not scaled)
      const fontSize = 10
      const labelPadding = 3
      ctx.font = `bold ${fontSize}px Arial`
      const textMetrics = ctx.measureText(labelText)
      const textWidth = textMetrics.width
      const textHeight = fontSize
      
      // Draw label background (above or below the box, using scaled coordinates)
      ctx.fillStyle = box.color
      const labelY = scaledY > textHeight + labelPadding * 2 
        ? scaledY - textHeight - labelPadding * 2 
        : scaledY + scaledHeight
      ctx.fillRect(scaledX, labelY, textWidth + labelPadding * 2, textHeight + labelPadding)

      // Draw label text (fixed size)
      ctx.fillStyle = '#ffffff'
      ctx.textBaseline = 'top'
      ctx.fillText(labelText, scaledX + labelPadding, labelY + labelPadding)

      // Draw dimensions text inside box if space available (fixed font size)
      if (scaledWidth > 50 && scaledHeight > 30) {
        const dimensionText = `${Math.round(box.width)} × ${Math.round(box.height)}`
        ctx.font = `10px Arial`
        ctx.fillStyle = box.color
        ctx.textBaseline = 'middle'
        ctx.textAlign = 'center'
        
        // Draw white background for dimension text (fixed size)
        const dimTextWidth = ctx.measureText(dimensionText).width
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.fillRect(
          scaledX + scaledWidth / 2 - dimTextWidth / 2 - 3,
          scaledY + scaledHeight / 2 - 6,
          dimTextWidth + 6,
          12
        )
        
        // Draw dimension text (fixed size, using scaled coordinates)
        ctx.fillStyle = box.color
        ctx.fillText(dimensionText, scaledX + scaledWidth / 2, scaledY + scaledHeight / 2)
        ctx.textAlign = 'start'
      }

      // Draw resize handles if selected (fixed size)
      if (isSelected) {
        const handleSize = 8  // Fixed size
        ctx.fillStyle = box.color
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        
        // Top-left (using scaled coordinates)
        ctx.fillRect(scaledX - handleSize / 2, scaledY - handleSize / 2, handleSize, handleSize)
        ctx.strokeRect(scaledX - handleSize / 2, scaledY - handleSize / 2, handleSize, handleSize)
        
        // Top-right
        ctx.fillRect(scaledX + scaledWidth - handleSize / 2, scaledY - handleSize / 2, handleSize, handleSize)
        ctx.strokeRect(scaledX + scaledWidth - handleSize / 2, scaledY - handleSize / 2, handleSize, handleSize)
        
        // Bottom-left
        ctx.fillRect(scaledX - handleSize / 2, scaledY + scaledHeight - handleSize / 2, handleSize, handleSize)
        ctx.strokeRect(scaledX - handleSize / 2, scaledY + scaledHeight - handleSize / 2, handleSize, handleSize)
        
        // Bottom-right
        ctx.fillRect(scaledX + scaledWidth - handleSize / 2, scaledY + scaledHeight - handleSize / 2, handleSize, handleSize)
        ctx.strokeRect(scaledX + scaledWidth - handleSize / 2, scaledY + scaledHeight - handleSize / 2, handleSize, handleSize)
      }
    })

    // Draw the box being drawn (preview) - fixed size line
    if (isDrawing && dragStart) {
      const canvas = canvasRef.current
      if (canvas) {
        const rect = canvas.getBoundingClientRect()
        const currentX = (lastMousePos.current.x - rect.left - offset.x) / scale
        const currentY = (lastMousePos.current.y - rect.top - offset.y) / scale
        
        const previewX = Math.min(dragStart.x, currentX)
        const previewY = Math.min(dragStart.y, currentY)
        const previewWidth = Math.abs(currentX - dragStart.x)
        const previewHeight = Math.abs(currentY - dragStart.y)
        
        // Calculate scaled preview coordinates
        const scaledPreviewX = previewX * scale + offset.x
        const scaledPreviewY = previewY * scale + offset.y
        const scaledPreviewWidth = previewWidth * scale
        const scaledPreviewHeight = previewHeight * scale
        
        // Draw preview box with dashed line (fixed line width)
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 2  // Fixed width
        ctx.setLineDash([8, 4])
        ctx.strokeRect(scaledPreviewX, scaledPreviewY, scaledPreviewWidth, scaledPreviewHeight)
        ctx.setLineDash([])
        
        // Draw preview dimensions (fixed font size)
        if (scaledPreviewWidth > 30 && scaledPreviewHeight > 30) {
          const dimText = `${Math.round(previewWidth)} × ${Math.round(previewHeight)}`
          ctx.font = '10px Arial'  // Fixed font size
          ctx.fillStyle = '#3b82f6'
          ctx.textBaseline = 'middle'
          ctx.textAlign = 'center'
          
          // Background for text
          const dimTextWidth = ctx.measureText(dimText).width
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
          ctx.fillRect(
            scaledPreviewX + scaledPreviewWidth / 2 - dimTextWidth / 2 - 3,
            scaledPreviewY + scaledPreviewHeight / 2 - 6,
            dimTextWidth + 6,
            12
          )
          
          ctx.fillStyle = '#3b82f6'
          ctx.fillText(dimText, scaledPreviewX + scaledPreviewWidth / 2, scaledPreviewY + scaledPreviewHeight / 2)
          ctx.textAlign = 'start'
        }
      }
    }
  }, [image, boxes, selectedId, scale, offset, imageSize, isDrawing, dragStart])

  // Redraw when dependencies change
  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  // Get mouse position relative to canvas
  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left - offset.x) / scale,
      y: (e.clientY - rect.top - offset.y) / scale
    }
  }

  // Get resize handle at position (using image coordinates)
  const getResizeHandle = (box: BoundingBox, x: number, y: number): string | null => {
    const handleSize = 8  // Fixed size in pixels
    const tolerance = handleSize / scale  // Convert to image coordinates

    if (Math.abs(x - box.x) < tolerance && Math.abs(y - box.y) < tolerance) return 'nw'
    if (Math.abs(x - (box.x + box.width)) < tolerance && Math.abs(y - box.y) < tolerance) return 'ne'
    if (Math.abs(x - box.x) < tolerance && Math.abs(y - (box.y + box.height)) < tolerance) return 'sw'
    if (Math.abs(x - (box.x + box.width)) < tolerance && Math.abs(y - (box.y + box.height)) < tolerance) return 'se'

    return null
  }

  // Check if point is inside box
  const isInsideBox = (box: BoundingBox, x: number, y: number): boolean => {
    return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height
  }

  // Mouse down handler
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return // Only left click

    const pos = getMousePos(e)

    // If Shift is pressed, start drawing new box
    if (e.shiftKey) {
      setIsDrawing(true)
      setDragStart(pos)
      setSelectedId(null)
      return
    }

    // If Ctrl/Cmd is pressed, start panning
    if (e.ctrlKey || e.metaKey) {
      setIsPanning(true)
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
      setSelectedId(null)
      return
    }

    // Check if clicking on selected box's resize handle
    if (selectedId) {
      const box = boxes.find(b => b.id === selectedId)
      if (box) {
        const handle = getResizeHandle(box, pos.x, pos.y)
        if (handle) {
          setIsResizing(true)
          setResizeHandle(handle)
          setDragStart(pos)
          return
        }
      }
    }

    // Check if clicking on any box
    let clickedBox = false
    for (let i = boxes.length - 1; i >= 0; i--) {
      if (isInsideBox(boxes[i], pos.x, pos.y)) {
        setSelectedId(boxes[i].id)
        setIsDragging(true)
        setDragStart({ x: pos.x - boxes[i].x, y: pos.y - boxes[i].y })
        clickedBox = true
        return
      }
    }

    // If not clicking on a box, deselect
    if (!clickedBox) {
      setSelectedId(null)
    }
  }

  // Mouse move handler
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Track last mouse position for drawing preview
    lastMousePos.current = { x: e.clientX, y: e.clientY }
    
    if (isResizing && selectedId) {
      const pos = getMousePos(e)
      const box = boxes.find(b => b.id === selectedId)
      if (!box) return

      const newBoxes = boxes.map(b => {
        if (b.id !== selectedId) return b

        let newBox = { ...b, action: b.isAI ? 'edited' as const : b.action }

        switch (resizeHandle) {
          case 'nw':
            newBox.width = newBox.width + (newBox.x - pos.x)
            newBox.height = newBox.height + (newBox.y - pos.y)
            newBox.x = pos.x
            newBox.y = pos.y
            break
          case 'ne':
            newBox.width = pos.x - newBox.x
            newBox.height = newBox.height + (newBox.y - pos.y)
            newBox.y = pos.y
            break
          case 'sw':
            newBox.width = newBox.width + (newBox.x - pos.x)
            newBox.x = pos.x
            newBox.height = pos.y - newBox.y
            break
          case 'se':
            newBox.width = pos.x - newBox.x
            newBox.height = pos.y - newBox.y
            break
        }

        // Ensure minimum size
        if (newBox.width < 20) newBox.width = 20
        if (newBox.height < 20) newBox.height = 20

        return newBox
      })

      setBoxes(newBoxes)
      drawCanvas()
    } else if (isDragging && selectedId) {
      const pos = getMousePos(e)
      const newBoxes = boxes.map(b => {
        if (b.id !== selectedId) return b
        
        // Keep box within image bounds
        const newX = Math.max(0, Math.min(pos.x - dragStart.x, imageSize.width - b.width))
        const newY = Math.max(0, Math.min(pos.y - dragStart.y, imageSize.height - b.height))
        
        return {
          ...b,
          x: newX,
          y: newY,
          action: b.isAI ? 'edited' as const : b.action
        }
      })
      setBoxes(newBoxes)
      drawCanvas()
    } else if (isPanning) {
      // Update pan offset (moves the entire canvas)
      setOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
      drawCanvas()
    } else if (isDrawing) {
      // Just redraw to show the drawing preview
      drawCanvas()
    }
  }

  // Mouse up handler
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDrawing) {
      const pos = getMousePos(e)
      const width = pos.x - dragStart.x
      const height = pos.y - dragStart.y

      if (Math.abs(width) > 10 && Math.abs(height) > 10) {
        const newBox: BoundingBox = {
          id: `user-${Date.now()}`,
          x: Math.min(dragStart.x, pos.x),
          y: Math.min(dragStart.y, pos.y),
          width: Math.abs(width),
          height: Math.abs(height),
          label: currentLabel,
          color: getColorBySeverity(currentLabel),
          action: 'added',
          isAI: false
        }

        const newBoxes = [...boxes, newBox]
        setBoxes(newBoxes)
        addToHistory(newBoxes)
      }
      setIsDrawing(false)
    } else if (isDragging || isResizing) {
      addToHistory(boxes)
      setIsDragging(false)
      setIsResizing(false)
      setResizeHandle(null)
    } else if (isPanning) {
      setIsPanning(false)
    }
  }

  const addToHistory = (newBoxes: BoundingBox[]) => {
    const newHistory = history.slice(0, historyStep + 1)
    newHistory.push(newBoxes)
    setHistory(newHistory)
    setHistoryStep(newHistory.length - 1)
  }

  const handleUndo = () => {
    if (historyStep > 0) {
      setHistoryStep(historyStep - 1)
      setBoxes(history[historyStep - 1])
      setSelectedId(null)
    }
  }

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      setHistoryStep(historyStep + 1)
      setBoxes(history[historyStep + 1])
      setSelectedId(null)
    }
  }

  const handleDeleteBox = () => {
    if (!selectedId) return
    const newBoxes = boxes.filter(b => b.id !== selectedId)
    setBoxes(newBoxes)
    setSelectedId(null)
    addToHistory(newBoxes)
  }

  // Store the initial scale for reset
  const [initialScale, setInitialScale] = useState(1)

  const handleZoomIn = () => {
    setScale(prev => {
      const newScale = prev + 0.1 // Increase by 10% increments
      return Math.min(newScale, 3) // Max 300%
    })
  }

  const handleZoomOut = () => {
    setScale(prev => {
      const newScale = prev - 0.1 // Decrease by 10% increments
      return Math.max(newScale, 0.3) // Min 30%
    })
  }

  const handleResetView = () => {
    // Reset to the initial fit-to-screen size
    setScale(initialScale)
    setOffset({ x: 0, y: 0 })
  }

  // Mouse wheel handler - disabled to prevent accidental zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    // Zoom only works with buttons for better control
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const annotations: AnnotationDTO[] = boxes.map(box => ({
        id: box.id.startsWith('user-') || box.id.startsWith('ai-') ? undefined : box.id,
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
        label: box.label,
        confidence: box.confidence,
        action: box.action
      }))

      const result = await saveAnnotations({
        imageId,
        userId,
        annotations
      })

      if (result) {
        console.log('✅ Annotations saved successfully:', result)
        if (onSave) {
          onSave(annotations)
        }
      } else {
        console.error('❌ Failed to save annotations')
      }
    } catch (error) {
      console.error('Error saving annotations:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-4"}>
      {/* Compact Toolbar */}
      {compact && (
        <div className="bg-muted p-2 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <Input
              value={currentLabel}
              onChange={(e) => setCurrentLabel(e.target.value)}
              className="h-7 text-xs flex-1 min-w-[100px]"
              placeholder="Label"
            />
            <Button variant="outline" size="sm" className="h-7 px-2" onClick={handleUndo} disabled={historyStep === 0}>
              <Undo className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" className="h-7 px-2" onClick={handleRedo} disabled={historyStep === history.length - 1}>
              <Redo className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" className="h-7 px-2" onClick={handleDeleteBox} disabled={!selectedId}>
              <Trash2 className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" className="h-7 px-2" onClick={handleZoomOut}>
              <ZoomOut className="h-3 w-3" />
            </Button>
            <span className="text-xs min-w-[45px] text-center">{Math.round(scale * 100)}%</span>
            <Button variant="outline" size="sm" className="h-7 px-2" onClick={handleZoomIn}>
              <ZoomIn className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" className="h-7 px-2" onClick={handleResetView}>
              <RotateCcw className="h-3 w-3" />
            </Button>
            <Button size="sm" className="h-7" onClick={handleSave} disabled={saving || boxes.length === 0}>
              <Save className="h-3 w-3 mr-1" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
          <div className="flex gap-2 text-xs flex-wrap">
            <Badge variant="outline" className="text-xs">Total: {boxes.length}</Badge>
            <Badge variant="secondary" className="text-xs">AI: {boxes.filter(b => b.isAI).length}</Badge>
            <Badge variant="default" className="text-xs">User: {boxes.filter(b => !b.isAI).length}</Badge>
            {selectedId && <Badge variant="destructive" className="text-xs">Selected</Badge>}
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <div><strong>Shift+Drag:</strong> Draw new box • <strong>Ctrl+Drag:</strong> Pan canvas </div>
          </div>
        </div>
      )}

      {/* Full Toolbar */}
      {!compact && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Square className="h-5 w-5" />
              Interactive Annotation Editor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="label-input">Label:</Label>
                <Input
                  id="label-input"
                  value={currentLabel}
                  onChange={(e) => setCurrentLabel(e.target.value)}
                  className="w-40"
                  placeholder="Enter label"
                />
              </div>
              
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" size="sm" onClick={handleUndo} disabled={historyStep === 0}>
                  <Undo className="h-4 w-4 mr-1" />
                  Undo
                </Button>
                <Button variant="outline" size="sm" onClick={handleRedo} disabled={historyStep === history.length - 1}>
                  <Redo className="h-4 w-4 mr-1" />
                  Redo
                </Button>
                <Button variant="outline" size="sm" onClick={handleDeleteBox} disabled={!selectedId}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm min-w-[60px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleResetView}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
              
              <Button className="ml-auto" onClick={handleSave} disabled={saving || boxes.length === 0}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Annotations'}
              </Button>
            </div>

            <div className="flex gap-4 text-sm">
              <Badge variant="outline">Total: {boxes.length} boxes</Badge>
              <Badge variant="secondary">AI: {boxes.filter(b => b.isAI).length}</Badge>
              <Badge variant="default">User: {boxes.filter(b => !b.isAI).length}</Badge>
              {selectedId && <Badge variant="destructive">Selected: {boxes.find(b => b.id === selectedId)?.label}</Badge>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Canvas */}
      <Card className={compact ? "border-0 shadow-none" : ""}>
        <CardContent className={compact ? "p-0" : "p-4"}>
          <div 
            ref={containerRef}
            className="border rounded-lg overflow-hidden bg-gray-100"
            style={{ height: compact ? '400px' : '600px' }}
          >
            <canvas
              ref={canvasRef}
              width={Math.max(imageSize.width * scale + Math.abs(offset.x) * 2, containerRef.current?.clientWidth || 800)}
              height={Math.max(imageSize.height * scale + Math.abs(offset.y) * 2, compact ? 400 : 600)}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              className="cursor-crosshair"
              style={{ display: 'block' }}
            />
          </div>
          
          {!compact && (
            <div className="mt-4 text-sm text-muted-foreground">
              <p>💡 <strong>Tips:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Shift + Drag</strong> to draw new bounding boxes</li>
                <li><strong>Ctrl + Drag</strong> (or Cmd + Drag on Mac) to pan the canvas</li>
                <li><strong>Zoom buttons</strong> (+/-) to zoom in/out, <strong>Reset button</strong> to fit to screen</li>
                <li><strong>Delete button</strong> to remove selected box</li>
                <li><strong>Color coding:</strong> Red = Critical, Orange = Major, Yellow = Minor, Blue = User-added</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
