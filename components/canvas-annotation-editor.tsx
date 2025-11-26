"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Trash2, 
  Square,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Plus
} from "lucide-react"

interface BoundingBox {
  id: string
  x: number
  y: number
  width: number
  height: number
  label: string
  confidence?: number
  severity?: 'Critical' | 'Warning' | 'Uncertain' // Priority level
  color: string
  action: 'added' | 'edited' | 'deleted' | 'confirmed'
  isAI?: boolean
  timestamp?: string // When the annotation was created/modified
  userId?: string // Who created/modified the annotation
  notes?: string // Optional comments or notes
  lastModified?: string // When it was last edited
  modificationTypes?: ('relocated' | 'resized' | 'label-changed' | 'deleted' | 'created')[] // Array of all modifications made
  modificationDetails?: string // Summary of all modifications
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
  onBoxesChange?: (boxes: BoundingBox[], deletedBoxes: BoundingBox[]) => void // Real-time box updates including deleted
  selectedBoxIndex?: number // Index of box to select from parent
  compact?: boolean
  // Optional: allow parent to push a note update into a specific box
  externalNoteUpdate?: { id: string; note: string; version: number }
  onExportCanvas?: (exportFn: () => string | null) => void // Callback to provide canvas export function
}

export function CanvasAnnotationEditor({
  imageUrl,
  imageId,
  userId = 'Guest',
  initialDetections = [],
  onBoxesChange,
  selectedBoxIndex,
  compact = false,
  externalNoteUpdate,
  onExportCanvas
}: CanvasAnnotationEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastMousePos = useRef({ x: 0, y: 0 })
  const [boxes, setBoxes] = useState<BoundingBox[]>([])
  const [deletedBoxes, setDeletedBoxes] = useState<BoundingBox[]>([]) // Track deleted boxes
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [originalBox, setOriginalBox] = useState<BoundingBox | null>(null) // Track original box state before modification
  const [currentLabel, setCurrentLabel] = useState("New Warning")
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [history, setHistory] = useState<BoundingBox[][]>([])
  const [historyStep, setHistoryStep] = useState(0)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [imageSize, setImageSize] = useState({ width: 800, height: 600 })
  
  // New box creation dialog states
  const [showNewBoxDialog, setShowNewBoxDialog] = useState(false)
  const [newBoxLabel, setNewBoxLabel] = useState("")
  const [newBoxSeverity, setNewBoxSeverity] = useState<"Critical" | "Warning">("Warning")
  const [newBoxConfidence, setNewBoxConfidence] = useState<number>(100)
  const [isDrawingNewBox, setIsDrawingNewBox] = useState(false)
  
  // Deletion dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteReason, setDeleteReason] = useState("")
  const [boxToDelete, setBoxToDelete] = useState<string | null>(null)

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
      const initialBoxes: BoundingBox[] = initialDetections.map((det, index) => {
        // Check if this detection has preserved metadata (from loaded annotations)
        const hasMetadata = 'id' in det || 'severity' in det || 'action' in det
        
        if (hasMetadata) {
          // This is a loaded annotation - preserve ALL its data
          const detWithMeta = det as any
          return {
            id: detWithMeta.id || `loaded-${index}`,
            x: det.bbox[0],
            y: det.bbox[1],
            width: det.bbox[2],
            height: det.bbox[3],
            label: det.type,
            confidence: det.confidence,
            severity: detWithMeta.severity,
            color: detWithMeta.severity === 'Critical' ? '#ef4444' : detWithMeta.severity === 'Warning' ? '#f59e0b' : '#eab308',
            action: detWithMeta.action || 'confirmed',
            isAI: detWithMeta.isAI || false,
            timestamp: detWithMeta.timestamp || new Date().toISOString(),
            userId: detWithMeta.userId || userId,
            notes: detWithMeta.notes,
            lastModified: detWithMeta.lastModified,
            modificationTypes: detWithMeta.modificationTypes || [],
            modificationDetails: detWithMeta.modificationDetails
          }
        } else {
          // This is a fresh AI detection
          return {
            id: `ai-${index}`,
            x: det.bbox[0],
            y: det.bbox[1],
            width: det.bbox[2],
            height: det.bbox[3],
            label: det.type,
            confidence: det.confidence,
            color: getColorBySeverity(det.type, det.confidence),
            action: 'confirmed' as const,
            isAI: true,
            timestamp: new Date().toISOString(),
            userId: 'AI-System',
            modificationTypes: ['created'],
            modificationDetails: 'AI Detection'
          }
        }
      })
      
      // Separate active and deleted boxes
      const activeBoxes = initialBoxes.filter(box => box.action !== 'deleted')
      const deletedBoxesList = initialBoxes.filter(box => box.action === 'deleted')
      
      setBoxes(activeBoxes)
      setDeletedBoxes(deletedBoxesList)
      setHistory([activeBoxes])
      setHistoryStep(0)
    }
  }, [initialDetections, boxes.length, userId])

  // Notify parent component when boxes change (real-time updates)
  useEffect(() => {
    if (onBoxesChange) {
      onBoxesChange(boxes, deletedBoxes)
    }
  }, [boxes, deletedBoxes, onBoxesChange])

  // Register canvas export function with parent
  useEffect(() => {
    if (onExportCanvas) {
      const exportFunction = () => {
        const canvas = canvasRef.current
        if (!canvas) {
          console.error('❌ [Canvas Export] Canvas ref is null')
          return null
        }
        try {
          console.log('📸 [Canvas Export] Exporting canvas with dimensions:', canvas.width, 'x', canvas.height)
          console.log('📸 [Canvas Export] Current boxes count:', boxes.length)
          const dataUrl = canvas.toDataURL('image/png')
          console.log('✅ [Canvas Export] Successfully exported canvas, data URL length:', dataUrl.length)
          return dataUrl
        } catch (error) {
          console.error('❌ [Canvas Export] Failed to export canvas:', error)
          return null
        }
      }
      onExportCanvas(exportFunction)
      console.log('📝 [Canvas Export] Export function registered with parent')
    }
  }, [onExportCanvas, boxes.length])

  // Apply external note updates from parent (e.g., from anomaly list UI)
  useEffect(() => {
    if (!externalNoteUpdate) return
    const { id, note } = externalNoteUpdate
    setBoxes(prev => prev.map(b => (b.id === id ? { ...b, notes: note, lastModified: new Date().toISOString(), userId } : b)))
    // No history push here to keep it lightweight; parent handles save
    // drawCanvas to reflect any visual indicators in future
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalNoteUpdate?.version])

  // Select box when parent requests it via selectedBoxIndex
  useEffect(() => {
    if (selectedBoxIndex !== undefined && selectedBoxIndex >= 0 && selectedBoxIndex < boxes.length) {
      const box = boxes[selectedBoxIndex]
      setSelectedId(box.id)
      console.log('📍 Selected box from parent:', selectedBoxIndex, box.id)
    }
  }, [selectedBoxIndex, boxes])

  // Get color based on severity level determined by confidence
  const getColorBySeverity = (label: string, confidence?: number): string => {
    // Primary color scheme based on confidence value as specified:
    // Red: High Severity (≥0.8)
    // Orange: Medium Severity (≥0.5)
    // Yellow: Low Severity (<0.5)
    if (confidence !== undefined) {
      if (confidence >= 0.8) return '#ff2b2bff' // Red - High Severity
      if (confidence >= 0.5) return '#fd9207ff' // Orange - Medium Severity
      return '#fded05ff' // Yellow - Low Severity
    }
    
    // Fallback based on label if confidence is not available
    const labelLower = label.toLowerCase()
    
    // High Severity terms - Red
    if (labelLower.includes('crack') || 
        labelLower.includes('damage') || 
        labelLower.includes('severe') ||
        labelLower.includes('critical') ||
        labelLower.includes('fire') ||
        labelLower.includes('leak')) {
      return '#ef4444' // Red
    }
    
    // Medium Severity terms - Orange
    if (labelLower.includes('corrosion') || 
        labelLower.includes('rust') || 
        labelLower.includes('moderate') ||
        labelLower.includes('major') ||
        labelLower.includes('wear')) {
      return '#f59e0b' // Orange
    }
    
    // Low Severity terms - Yellow
    if (labelLower.includes('minor') || 
        labelLower.includes('dirt') || 
        labelLower.includes('dust') ||
        labelLower.includes('discolor')) {
      return '#eab308' // Yellow
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
    boxes.forEach((box, index) => {
      const isSelected = box.id === selectedId
      const boxNumber = index + 1 // 1-based numbering

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

      // Draw box number badge in top-left corner
      const badgeSize = 20
      const badgePadding = 2
      
      // Draw badge background circle
      ctx.fillStyle = box.color
      ctx.beginPath()
      ctx.arc(scaledX - badgeSize/2, scaledY - badgeSize/2, badgeSize/2, 0, Math.PI * 2)
      ctx.fill()
      
      // Draw box number
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 12px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(boxNumber.toString(), scaledX - badgeSize/2, scaledY - badgeSize/2)
      ctx.textAlign = 'start'
      ctx.textBaseline = 'top'

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

  // Check if clicking on the numbered badge (in image coordinates)
  const isClickingOnBadge = (box: BoundingBox, x: number, y: number): boolean => {
    const badgeSize = 20
    const badgeRadius = badgeSize / 2
    const badgeCenterX = box.x - badgeRadius
    const badgeCenterY = box.y - badgeRadius

    // Increase clickable area by 100% for easier clicking
    const clickableRadius = badgeRadius * 2.0

    // Calculate distance from click to badge center
    const dx = x - badgeCenterX
    const dy = y - badgeCenterY
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    return distance <= clickableRadius
  }

  // Mouse down handler
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return // Only left click

    const pos = getMousePos(e)

    // If in new box drawing mode (after clicking "Create New Bounding Box" button)
    if (isDrawingNewBox) {
      setIsDrawing(true)
      setDragStart(pos)
      setSelectedId(null)
      return
    }

    // If Shift is pressed, start drawing new box (legacy mode - keep for compatibility)
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
          setOriginalBox({ ...box }) // Save original box state
          return
        }
      }
    }

    // Check if clicking on any box's numbered badge (higher priority than box body)
    for (let i = boxes.length - 1; i >= 0; i--) {
      if (isClickingOnBadge(boxes[i], pos.x, pos.y)) {
        console.log('🎯 Clicked on badge for box:', boxes[i].id, i)
        setSelectedId(boxes[i].id)
        // Don't start dragging when clicking badge, just select
        return
      }
    }

    // Check if clicking on any box
    let clickedBox = false
    for (let i = boxes.length - 1; i >= 0; i--) {
      if (isInsideBox(boxes[i], pos.x, pos.y)) {
        setSelectedId(boxes[i].id)
        setIsDragging(true)
        setDragStart({ x: pos.x - boxes[i].x, y: pos.y - boxes[i].y })
        setOriginalBox({ ...boxes[i] }) // Save original box state
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
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    // Check if hovering over a badge and update cursor
    const pos = getMousePos(e)
    let hoveringBadge = false
    for (let i = boxes.length - 1; i >= 0; i--) {
      if (isClickingOnBadge(boxes[i], pos.x, pos.y)) {
        hoveringBadge = true
        canvas.style.cursor = 'pointer'
        break
      }
    }
    if (!hoveringBadge && !isResizing && !isDragging && !isDrawing && !isPanning) {
      canvas.style.cursor = 'crosshair'
    }
    
    if (isResizing && selectedId) {
      const pos = getMousePos(e)
      const box = boxes.find(b => b.id === selectedId)
      if (!box) return

      const newBoxes = boxes.map(b => {
        if (b.id !== selectedId) return b

        let newBox = { 
          ...b, 
          action: b.isAI ? 'edited' as const : b.action,
          lastModified: new Date().toISOString(),
          userId: userId
        }

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
          action: b.isAI ? 'edited' as const : b.action,
          lastModified: new Date().toISOString(),
          userId: userId
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
        // Use the label and severity from dialog if in new box mode, otherwise use current label
        const label = isDrawingNewBox ? newBoxLabel : currentLabel
        const severity = isDrawingNewBox ? newBoxSeverity : undefined
        const confidence = isDrawingNewBox ? (newBoxConfidence / 100) : 1.0 // Always provide confidence, default to 1.0
        
        const newBox: BoundingBox = {
          id: `user-${Date.now()}`,
          x: Math.min(dragStart.x, pos.x),
          y: Math.min(dragStart.y, pos.y),
          width: Math.abs(width),
          height: Math.abs(height),
          label: label,
          confidence: confidence,
          severity: severity, // Store severity in the box
          color: severity 
            ? (severity === 'Critical' ? '#ef4444' : '#f59e0b')
            : getColorBySeverity(label),
          action: 'added',
          isAI: false,
          timestamp: new Date().toISOString(),
          userId: userId,
          modificationTypes: ['created'],
          modificationDetails: 'Created'
        }

        const newBoxes = [...boxes, newBox]
        setBoxes(newBoxes)
        addToHistory(newBoxes)
        
        // Reset new box mode
        if (isDrawingNewBox) {
          setIsDrawingNewBox(false)
          setNewBoxLabel("")
          setNewBoxSeverity("Warning")
          setNewBoxConfidence(100)
        }
      }
      setIsDrawing(false)
    } else if (isDragging || isResizing) {
      // Calculate modification details
      if (originalBox && selectedId) {
        const currentBox = boxes.find(b => b.id === selectedId)
        if (currentBox) {
          let newModificationType: 'relocated' | 'resized' = 'relocated'
          
          if (isDragging) {
            newModificationType = 'relocated'
          } else if (isResizing) {
            newModificationType = 'resized'
          }
          
          // Update the box with modification details - add to existing modifications
          const updatedBoxes = boxes.map(b => {
            if (b.id === selectedId) {
              // Get existing modification types or start with empty array
              const existingTypes = b.modificationTypes || []
              
              // Add new modification type if not already present
              const updatedTypes = existingTypes.includes(newModificationType)
                ? existingTypes
                : [...existingTypes, newModificationType]
              
              // Create readable modification summary
              const modificationSummary = updatedTypes
                .filter(type => type !== 'created') // Don't show 'created' in modifications
                .map(type => type.charAt(0).toUpperCase() + type.slice(1))
                .join(', ')
              
              return {
                ...b,
                modificationTypes: updatedTypes,
                modificationDetails: modificationSummary
              }
            }
            return b
          })
          setBoxes(updatedBoxes)
        }
      }
      
      addToHistory(boxes)
      setIsDragging(false)
      setIsResizing(false)
      setResizeHandle(null)
      setOriginalBox(null) // Clear original box state
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
    
    // Show deletion dialog to get reason
    setBoxToDelete(selectedId)
    setDeleteReason("")
    setShowDeleteDialog(true)
  }
  
  // Confirm deletion with reason
  const confirmDeleteBox = () => {
    if (!boxToDelete) return
    
    // Find the box being deleted
    const deletedBox = boxes.find(b => b.id === boxToDelete)
    if (deletedBox) {
      // Add to deleted boxes array with deletion info and user-provided reason
      const deletedBoxWithInfo: BoundingBox = {
        ...deletedBox,
        action: 'deleted',
        lastModified: new Date().toISOString(),
        userId: userId,
        modificationTypes: [...(deletedBox.modificationTypes || []), 'deleted'],
        modificationDetails: deleteReason || `Deleted ${deletedBox.isAI ? 'AI-detected' : 'user-created'} anomaly`,
        notes: deleteReason // Store the deletion reason in notes as well
      }
      setDeletedBoxes([...deletedBoxes, deletedBoxWithInfo])
    }
    
    const newBoxes = boxes.filter(b => b.id !== boxToDelete)
    setBoxes(newBoxes)
    setSelectedId(null)
    addToHistory(newBoxes)
    
    // Close dialog and reset
    setShowDeleteDialog(false)
    setBoxToDelete(null)
    setDeleteReason("")
  }

  // Function to update the selected box's label
  const handleEditSelectedLabel = (newLabel: string) => {
    if (!selectedId) return

    const newBoxes = boxes.map(box => {
      if (box.id === selectedId) {
        // Get existing modification types or start with empty array
        const existingTypes = box.modificationTypes || []
        const updatedTypes: ('relocated' | 'resized' | 'label-changed' | 'deleted' | 'created')[] = existingTypes.includes('label-changed')
          ? existingTypes
          : [...existingTypes, 'label-changed']
        
        // Create readable modification summary
        const modificationSummary = updatedTypes
          .filter(type => type !== 'created')
          .map(type => type === 'label-changed' ? 'Label changed' : type.charAt(0).toUpperCase() + type.slice(1))
          .join(', ')
        
        return {
          ...box,
          label: newLabel,
          color: getColorBySeverity(newLabel, box.confidence),
          action: box.isAI ? 'edited' as const : box.action,
          lastModified: new Date().toISOString(),
          userId: userId,
          modificationTypes: updatedTypes,
          modificationDetails: modificationSummary
        }
      }
      return box
    })

    setBoxes(newBoxes)
    addToHistory(newBoxes)
  }

  // Handle create new bounding box button click
  const handleCreateNewBox = () => {
    setShowNewBoxDialog(true)
  }

  // Handle dialog confirm - start drawing mode
  const handleDialogConfirm = () => {
    if (!newBoxLabel.trim()) {
      alert("Please enter a description for the anomaly")
      return
    }
    
    setShowNewBoxDialog(false)
    setIsDrawingNewBox(true)
    // Change cursor to indicate drawing mode
  }

  // Handle dialog cancel
  const handleDialogCancel = () => {
    setShowNewBoxDialog(false)
    setNewBoxLabel("")
    setNewBoxSeverity("Warning")
    setNewBoxConfidence(100)
    setIsDrawingNewBox(false)
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

  return (
    <div className={compact ? "space-y-2" : "space-y-4"}>
      {/* Compact Toolbar */}
      {compact && (
        <div className="bg-muted p-2 rounded-lg space-y-2">
          {/* First Row - Zoom Controls */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
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
          </div>
          
          {/* Second Row - Action Controls */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <Button 
              variant={isDrawingNewBox ? "default" : "outline"} 
              size="sm" 
              className="h-7 px-2" 
              onClick={handleCreateNewBox}
            >
              <Plus className="h-3 w-3 mr-1" />
              New Box
            </Button>
            <Button variant="outline" size="sm" className="h-7 px-2" onClick={handleUndo} disabled={historyStep === 0}>
              <Undo className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" className="h-7 px-2" onClick={handleRedo} disabled={historyStep === history.length - 1}>
              <Redo className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" className="h-7 px-2" onClick={handleDeleteBox} disabled={!selectedId}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="flex gap-2 text-xs flex-wrap">
            <Badge variant="outline" className="text-xs">Total: {boxes.length}</Badge>
            <Badge variant="secondary" className="text-xs">AI: {boxes.filter(b => b.isAI).length}</Badge>
            <Badge variant="default" className="text-xs">User: {boxes.filter(b => !b.isAI).length}</Badge>
            {selectedId && (
              <Badge variant="destructive" className="text-xs">
                {boxes.find(b => b.id === selectedId)?.isAI ? "Editing AI Detection" : "Editing Warning"}
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            {isDrawingNewBox ? (
              <div className="text-blue-600 dark:text-blue-400 font-semibold">
                ✏️ Click and drag on the image to draw the bounding box for: "{newBoxLabel}"
              </div>
            ) : (
              <div><strong>Shift+Drag:</strong> Draw new box • <strong>Ctrl+Drag:</strong> Pan canvas</div>
            )}
            {selectedId && <div><strong>Selected Box:</strong> Edit warning message in the input field above</div>}
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
            {/* First Row - Zoom Controls */}
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
            </div>
            
            {/* Second Row - Action Controls */}
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={isDrawingNewBox ? "default" : "outline"} 
                size="sm" 
                onClick={handleCreateNewBox}
              >
                <Plus className="h-4 w-4 mr-1" />
                Create New Bounding Box
              </Button>
              
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
                <li><strong>Create New Bounding Box button</strong> to add a new anomaly with custom details</li>
                <li><strong>Shift + Drag</strong> to draw new bounding boxes (legacy mode)</li>
                <li><strong>Click a box</strong> to select it and edit its warning message</li>
                <li><strong>Ctrl + Drag</strong> (or Cmd + Drag on Mac) to pan the canvas</li>
                <li><strong>Zoom buttons</strong> (+/-) to zoom in/out, <strong>Reset button</strong> to fit to screen</li>
                <li><strong>Delete button</strong> to remove selected box</li>
                <li><strong>Color coding:</strong> Red = Critical, Orange = Warning, Yellow = Minor</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Bounding Box Dialog */}
      <Dialog open={showNewBoxDialog} onOpenChange={setShowNewBoxDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Bounding Box</DialogTitle>
            <DialogDescription>
              Enter the anomaly details. After clicking Start Drawing, click and drag on the image to draw the bounding box.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="anomaly-label">Anomaly Description</Label>
              <Input
                id="anomaly-label"
                placeholder="e.g., Point Overload, Oil Leak, etc."
                value={newBoxLabel}
                onChange={(e) => setNewBoxLabel(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="severity-select">Priority Level</Label>
              <Select value={newBoxSeverity} onValueChange={(value: "Critical" | "Warning") => setNewBoxSeverity(value)}>
                <SelectTrigger id="severity-select">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Critical">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span>Critical - Immediate Action</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Warning">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span>Warning - Monitor Closely</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confidence-input">Confidence Level (%)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="confidence-input"
                  type="number"
                  min="0"
                  max="100"
                  value={newBoxConfidence}
                  onChange={(e) => setNewBoxConfidence(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-24"
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newBoxConfidence}
                  onChange={(e) => setNewBoxConfidence(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground min-w-[3rem] text-right">{newBoxConfidence}%</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleDialogCancel}>
              Cancel
            </Button>
            <Button onClick={handleDialogConfirm}>
              Start Drawing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Deletion Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bounding Box</DialogTitle>
            <DialogDescription>
              Please provide a reason for deleting this anomaly. This helps maintain an audit trail.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="delete-reason">Deletion Reason *</Label>
              <Textarea
                id="delete-reason"
                placeholder="e.g., False positive, Duplicate detection, Not an anomaly..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This reason will be recorded for tracking and quality assurance purposes.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteDialog(false)
                setBoxToDelete(null)
                setDeleteReason("")
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteBox}
              disabled={!deleteReason.trim()}
            >
              Delete Anomaly
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
