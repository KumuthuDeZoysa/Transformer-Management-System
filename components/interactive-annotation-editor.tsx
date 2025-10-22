"use client"

import React, { useState, useRef, useEffect } from "react"
import dynamic from "next/dynamic"
import { saveAnnotations, type AnnotationDTO } from "@/lib/annotation-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Save, 
  Plus, 
  Trash2, 
  Move, 
  Square,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from "lucide-react"

// Dynamically import Konva components with no SSR
const Stage = dynamic(() => import("react-konva").then((mod) => mod.Stage), { ssr: false })
const Layer = dynamic(() => import("react-konva").then((mod) => mod.Layer), { ssr: false })
const KonvaImage = dynamic(() => import("react-konva").then((mod) => mod.Image), { ssr: false })
const Rect = dynamic(() => import("react-konva").then((mod) => mod.Rect), { ssr: false })
const Text = dynamic(() => import("react-konva").then((mod) => mod.Text), { ssr: false })
const Transformer = dynamic(() => import("react-konva").then((mod) => mod.Transformer), { ssr: false })

// Custom hook to load images for Konva
function useKonvaImage(url: string) {
  const [image, setImage] = useState<HTMLImageElement | undefined>(undefined)
  
  useEffect(() => {
    if (!url) return
    
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = url
    
    img.onload = () => {
      setImage(img)
    }
    
    img.onerror = (err) => {
      console.error('Failed to load image:', url, err)
    }
    
    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [url])
  
  return image
}

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

interface InteractiveAnnotationEditorProps {
  imageUrl: string
  imageId: string
  userId?: string
  initialDetections?: Array<{
    bbox: number[]
    type: string
    confidence: number
  }>
  onSave?: (annotations: AnnotationDTO[]) => void
  compact?: boolean // New prop for compact mode
}

export function InteractiveAnnotationEditor({
  imageUrl,
  imageId,
  userId = 'admin',
  initialDetections = [],
  onSave,
  compact = false
}: InteractiveAnnotationEditorProps) {
  const [boxes, setBoxes] = useState<BoundingBox[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [newBox, setNewBox] = useState<{ x: number; y: number } | null>(null)
  const [currentLabel, setCurrentLabel] = useState("Unknown")
  const [scale, setScale] = useState(1)
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 })
  const [history, setHistory] = useState<BoundingBox[][]>([])
  const [historyStep, setHistoryStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [isClient, setIsClient] = useState(false)
  
  const stageRef = useRef<any>(null)
  const layerRef = useRef<any>(null)
  const transformerRef = useRef<any>(null)
  const image = useKonvaImage(imageUrl)
  
  const [imageSize, setImageSize] = useState({ width: 800, height: 600 })

  // Client-side only rendering
  useEffect(() => {
    setIsClient(true)
  }, [])

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
        color: getColorByConfidence(det.confidence),
        action: 'confirmed' as const,
        isAI: true
      }))
      setBoxes(initialBoxes)
      setHistory([initialBoxes])
      setHistoryStep(0)
    }
  }, [initialDetections])

  // Update image size when loaded
  useEffect(() => {
    if (image) {
      setImageSize({
        width: image.width,
        height: image.height
      })
    }
  }, [image])

  // Update transformer when selection changes
  useEffect(() => {
    if (selectedId && transformerRef.current) {
      const node = layerRef.current?.findOne(`#${selectedId}`)
      if (node) {
        transformerRef.current.nodes([node])
        transformerRef.current.getLayer()?.batchDraw()
      }
    }
  }, [selectedId])

  const getColorByConfidence = (confidence: number): string => {
    if (confidence >= 0.8) return '#ef4444' // Red for high confidence
    if (confidence >= 0.5) return '#f59e0b' // Orange for medium
    return '#6b7280' // Gray for low
  }

  const handleMouseDown = (e: any) => {
    if (e.target === e.target.getStage() || e.target.getClassName() === 'Image') {
      // Start drawing new box
      const stage = e.target.getStage()
      const point = stage.getPointerPosition()
      const relativePoint = {
        x: (point.x - stagePos.x) / scale,
        y: (point.y - stagePos.y) / scale
      }
      
      setIsDrawing(true)
      setNewBox(relativePoint)
      setSelectedId(null)
    }
  }

  const handleMouseMove = (e: any) => {
    if (!isDrawing || !newBox) return

    const stage = e.target.getStage()
    const point = stage.getPointerPosition()
    const relativePoint = {
      x: (point.x - stagePos.x) / scale,
      y: (point.y - stagePos.y) / scale
    }

    // Update temporary box preview
    const width = relativePoint.x - newBox.x
    const height = relativePoint.y - newBox.y

    // Draw preview (this will be handled in the render)
  }

  const handleMouseUp = (e: any) => {
    if (!isDrawing || !newBox) return

    const stage = e.target.getStage()
    const point = stage.getPointerPosition()
    const relativePoint = {
      x: (point.x - stagePos.x) / scale,
      y: (point.y - stagePos.y) / scale
    }

    const width = relativePoint.x - newBox.x
    const height = relativePoint.y - newBox.y

    // Only create box if it has minimum size
    if (Math.abs(width) > 10 && Math.abs(height) > 10) {
      const newBoundingBox: BoundingBox = {
        id: `user-${Date.now()}`,
        x: Math.min(newBox.x, relativePoint.x),
        y: Math.min(newBox.y, relativePoint.y),
        width: Math.abs(width),
        height: Math.abs(height),
        label: currentLabel,
        color: '#3b82f6', // Blue for user-created
        action: 'added',
        isAI: false
      }

      const updatedBoxes = [...boxes, newBoundingBox]
      setBoxes(updatedBoxes)
      addToHistory(updatedBoxes)
    }

    setIsDrawing(false)
    setNewBox(null)
  }

  const handleBoxClick = (id: string) => {
    setSelectedId(id)
  }

  const handleBoxDragEnd = (id: string, e: any) => {
    const newBoxes = boxes.map(box => {
      if (box.id === id) {
        return {
          ...box,
          x: e.target.x(),
          y: e.target.y(),
          action: box.isAI ? 'edited' as const : box.action
        }
      }
      return box
    })
    setBoxes(newBoxes)
    addToHistory(newBoxes)
  }

  const handleBoxTransform = (id: string, node: any) => {
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()

    const newBoxes = boxes.map(box => {
      if (box.id === id) {
        return {
          ...box,
          x: node.x(),
          y: node.y(),
          width: Math.max(10, node.width() * scaleX),
          height: Math.max(10, node.height() * scaleY),
          action: box.isAI ? 'edited' as const : box.action
        }
      }
      return box
    })

    // Reset scale
    node.scaleX(1)
    node.scaleY(1)

    setBoxes(newBoxes)
    addToHistory(newBoxes)
  }

  const handleDeleteBox = () => {
    if (!selectedId) return

    const updatedBoxes = boxes.filter(box => box.id !== selectedId)
    setBoxes(updatedBoxes)
    setSelectedId(null)
    addToHistory(updatedBoxes)
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

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 5))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.5))
  }

  const handleResetView = () => {
    setScale(1)
    setStagePos({ x: 0, y: 0 })
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
        action: box.action,
        userId: userId, // Always set the current user as the one making the changes
        isAI: box.isAI,
        severity: box.confidence && box.confidence >= 0.8 ? 'Critical' : 
                 box.confidence && box.confidence >= 0.5 ? 'Warning' : 'Uncertain'
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

  // Prevent SSR rendering
  if (!isClient) {
    return <div className="flex items-center justify-center p-8">Loading editor...</div>
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-4"}>
      {/* Toolbar */}
      {!compact && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Square className="h-5 w-5" />
              Interactive Annotation Editor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Controls */}
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUndo}
                  disabled={historyStep === 0}
                >
                  <Undo className="h-4 w-4 mr-1" />
                  Undo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRedo}
                  disabled={historyStep === history.length - 1}
                >
                  <Redo className="h-4 w-4 mr-1" />
                  Redo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteBox}
                  disabled={!selectedId}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>

            {/* Zoom Controls */}
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
              
              <Button 
                className="ml-auto" 
                onClick={handleSave}
                disabled={saving || boxes.length === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Annotations'}
              </Button>
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-sm">
              <Badge variant="outline">
                Total: {boxes.length} boxes
              </Badge>
              <Badge variant="secondary">
                AI: {boxes.filter(b => b.isAI).length}
              </Badge>
              <Badge variant="default">
                User: {boxes.filter(b => !b.isAI).length}
              </Badge>
              {selectedId && (
                <Badge variant="destructive">
                  Selected: {boxes.find(b => b.id === selectedId)?.label}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compact Toolbar */}
      {compact && (
        <div className="bg-muted p-2 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <Input
              value={currentLabel}
              onChange={(e) => setCurrentLabel(e.target.value)}
              className="h-7 text-xs flex-1"
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
            <Button size="sm" className="h-7" onClick={handleSave} disabled={saving || boxes.length === 0}>
              <Save className="h-3 w-3 mr-1" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
          <div className="flex gap-2 text-xs">
            <Badge variant="outline" className="text-xs">Total: {boxes.length}</Badge>
            <Badge variant="secondary" className="text-xs">AI: {boxes.filter(b => b.isAI).length}</Badge>
            <Badge variant="default" className="text-xs">User: {boxes.filter(b => !b.isAI).length}</Badge>
          </div>
        </div>
      )}

      {/* Canvas */}
      <Card className={compact ? "border-0 shadow-none" : ""}>
        <CardContent className={compact ? "p-0" : "p-4"}>
          <div className="border rounded-lg overflow-hidden bg-gray-100">
            <Stage
              ref={stageRef}
              width={Math.min(imageSize.width, 1200)}
              height={Math.min(imageSize.height, 800)}
              scaleX={scale}
              scaleY={scale}
              x={stagePos.x}
              y={stagePos.y}
              draggable={!isDrawing}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onDragEnd={(e) => {
                setStagePos({
                  x: e.target.x(),
                  y: e.target.y()
                })
              }}
            >
              <Layer ref={layerRef}>
                {/* Image */}
                {image && (
                  <KonvaImage
                    image={image}
                    width={imageSize.width}
                    height={imageSize.height}
                  />
                )}

                {/* Bounding Boxes */}
                {boxes.map((box) => (
                  <React.Fragment key={box.id}>
                    <Rect
                      id={box.id}
                      x={box.x}
                      y={box.y}
                      width={box.width}
                      height={box.height}
                      stroke={box.color}
                      strokeWidth={3 / scale}
                      fill="transparent"
                      draggable
                      onClick={() => handleBoxClick(box.id)}
                      onTap={() => handleBoxClick(box.id)}
                      onDragEnd={(e) => handleBoxDragEnd(box.id, e)}
                      onTransformEnd={(e) => handleBoxTransform(box.id, e.target)}
                    />
                    <Text
                      x={box.x}
                      y={box.y - 20 / scale}
                      text={`${box.label} ${box.confidence ? `(${Math.round(box.confidence * 100)}%)` : ''}`}
                      fontSize={14 / scale}
                      fill={box.color}
                      fontStyle="bold"
                    />
                  </React.Fragment>
                ))}

                {/* Transformer */}
                {selectedId && (
                  <Transformer
                    ref={transformerRef}
                    boundBoxFunc={(oldBox, newBox) => {
                      // Limit resize
                      if (newBox.width < 10 || newBox.height < 10) {
                        return oldBox
                      }
                      return newBox
                    }}
                  />
                )}
              </Layer>
            </Stage>
          </div>
          
          {!compact && (
            <div className="mt-4 text-sm text-muted-foreground">
              <p>💡 <strong>Tips:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Click and drag on the image to draw new bounding boxes</li>
                <li>Click a box to select it, then drag to move or use handles to resize</li>
                <li>Use Delete button to remove selected box</li>
                <li>Drag the canvas to pan, use mouse wheel to zoom</li>
                <li>AI-detected boxes are in red/orange, user-created boxes are in blue</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
