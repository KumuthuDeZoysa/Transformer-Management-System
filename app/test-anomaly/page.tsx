"use client"

import { AnomalyViewer } from "@/components/anomaly-viewer"
import { Card } from "@/components/ui/card"
import { useState } from "react"

export default function TestAnomalyPage() {
  // Sample thermal image URLs for testing
  const [baselineUrl] = useState(
    "https://res.cloudinary.com/demo/image/upload/sample.jpg" // Replace with your baseline image
  )
  const [maintenanceUrl] = useState(
    "https://res.cloudinary.com/dtyjmwyrp/image/upload/v1759398379/pipeline_outputs/xgytdqjqosrbkjpmiflh.jpg"
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Anomaly Detection Test</h1>
          <p className="text-muted-foreground mt-2">
            Test the AnomalyViewer component with sample thermal images
          </p>
        </div>
      </div>

      <Card className="p-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <h2 className="font-semibold text-lg mb-2">🧪 Testing Instructions</h2>
        <ul className="space-y-2 text-sm">
          <li>✅ Check that both images load correctly</li>
          <li>✅ Verify anomaly detection runs automatically</li>
          <li>✅ Hover over bounding boxes to see tooltips</li>
          <li>✅ Check color coding: Red (High), Orange (Medium), Yellow (Low)</li>
          <li>✅ Verify detection list shows severity and scores</li>
          <li>✅ Test hover synchronization between SVG and list</li>
        </ul>
      </Card>

      {/* Anomaly Viewer Component */}
      <AnomalyViewer 
        baselineUrl={baselineUrl}
        maintenanceUrl={maintenanceUrl}
      />

      {/* Additional Test Information */}
      <Card className="p-6">
        <h2 className="font-semibold text-lg mb-4">Expected Results</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Backend Response Structure:</h3>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
{`{
  "boxed_url": "https://...",
  "boxes": [
    {"box": [1353, 800, 149, 61], "type": "Point Overload (Faulty)"},
    {"box": [649, 1050, 94, 83], "type": "Point Overload (Potential)"},
    ...
  ],
  "filtered_url": "https://...",
  "label": "Normal",
  "mask_url": "https://..."
}`}
            </pre>
          </div>

          <div>
            <h3 className="font-medium mb-2">Color Coding:</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500"></div>
                <span>Red: High Severity (score ≥ 0.8)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-500"></div>
                <span>Orange: Medium (score ≥ 0.5)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500"></div>
                <span>Yellow: Low (score &lt; 0.5)</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Tooltip Content:</h3>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Anomaly type (e.g., "Point Overload (Faulty)")</li>
              <li>Severity level (High/Medium/Low) with percentage</li>
              <li>Confidence score (0.00 - 1.00)</li>
              <li>Bounding box coordinates (X, Y, W, H)</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* API Endpoints Reference */}
      <Card className="p-6">
        <h2 className="font-semibold text-lg mb-4">API Endpoints</h2>
        <div className="space-y-2 text-sm font-mono">
          <div className="flex justify-between items-center p-2 bg-muted rounded">
            <span>Backend Health:</span>
            <a 
              href="http://localhost:8080/api/health" 
              target="_blank"
              className="text-blue-600 hover:underline"
            >
              http://localhost:8080/api/health
            </a>
          </div>
          <div className="flex justify-between items-center p-2 bg-muted rounded">
            <span>Anomaly Health:</span>
            <a 
              href="http://localhost:8080/api/anomalies/health" 
              target="_blank"
              className="text-blue-600 hover:underline"
            >
              http://localhost:8080/api/anomalies/health
            </a>
          </div>
          <div className="flex justify-between items-center p-2 bg-muted rounded">
            <span>Detect Anomalies:</span>
            <span className="text-muted-foreground">POST /api/anomalies/detect</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
