"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import backendApi, { type BackendTransformer } from "@/lib/backend-api"
import { transformerApi } from "@/lib/mock-api"
import { seedTransformers } from "@/lib/seed-transformers"
import { checkFeedbackTableExists, seedSampleFeedback, FEEDBACK_TABLE_SQL } from "@/lib/feedback-db-setup"

export default function SettingsPage() {
  const [transformers, setTransformers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [seeded, setSeeded] = useState(false)
  const [backendConnected, setBackendConnected] = useState(false)
  const [feedbackTableExists, setFeedbackTableExists] = useState(false)
  const [checkingFeedbackTable, setCheckingFeedbackTable] = useState(true)
  const [feedbackSeeding, setFeedbackSeeding] = useState(false)

  useEffect(() => {
    const loadTransformers = async () => {
      try {
        // Check if backend is available
        const healthCheck = await backendApi.health.checkBackendStatus()
        setBackendConnected(healthCheck.status === 'healthy')

        if (healthCheck.status === 'healthy') {
          console.log('🚀 Loading transformers from Spring Boot backend...')
          const backendTransformers = await backendApi.transformers.getAll()
          // Convert to display format
          const displayData = backendTransformers.map((t: BackendTransformer) => ({
            id: t.id,
            code: t.code,
            pole_no: t.poleNo,
            region: t.region,
            type: t.type,
            capacity: t.capacity,
            location: t.location,
            status: t.status,
            last_inspection: t.lastInspection,
            created_at: t.createdAt,
            updated_at: t.updatedAt,
          }))
          setTransformers(displayData)
        } else {
          console.log('📡 Backend unavailable, using mock data...')
          const mockTransformers = await transformerApi.getAll()
          // Convert mock data to display format
          const displayData = mockTransformers.map((t) => ({
            id: t.id,
            code: t.id,
            pole_no: t.poleNo,
            region: t.region,
            type: t.type,
            capacity: t.capacity,
            location: t.location,
            status: t.status,
            last_inspection: t.lastInspection,
            created_at: t.createdAt,
            updated_at: t.updatedAt,
          }))
          setTransformers(displayData)
        }
      } catch (error) {
        console.error('Failed to load transformers:', error)
      }
    }
    
    loadTransformers()

    // Check feedback table exists
    const checkFeedbackTable = async () => {
      setCheckingFeedbackTable(true)
      const { exists } = await checkFeedbackTableExists()
      setFeedbackTableExists(exists)
      setCheckingFeedbackTable(false)
    }
    checkFeedbackTable()
  }, [seeded])

  async function handleSeed() {
    setLoading(true)
    try {
      await seedTransformers()
      setSeeded(s => !s)
    } catch (e) {
      alert("Seeding failed: " + (e as any)?.message)
    }
    setLoading(false)
  }

  async function handleFeedbackSeed() {
    setFeedbackSeeding(true)
    try {
      const success = await seedSampleFeedback()
      if (success) {
        alert("Sample feedback log created successfully!")
      } else {
        alert("Failed to create sample feedback. Make sure the table exists first.")
      }
    } catch (e) {
      alert("Seeding failed: " + (e as any)?.message)
    }
    setFeedbackSeeding(false)
  }

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
            <h1 className="text-3xl font-sans font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground font-serif">Configure system preferences and thresholds</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Database Schema & Seed Data for Transformer */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-sans">Transformer Database Schema & Seed Data</CardTitle>
              <CardDescription className="font-serif">Use this schema and sample data to initialize your database for testing.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center justify-between">
                <Label className="font-serif mb-1 block">Current Transformers in Database</Label>
                <Button size="sm" onClick={handleSeed} disabled={loading}>
                  {loading ? "Seeding..." : "Seed Data"}
                </Button>
              </div>
              <div className="mb-4 max-h-48 overflow-auto border rounded bg-muted p-2">
                {transformers.length === 0 ? (
                  <div className="text-xs text-muted-foreground font-mono">No transformers found.</div>
                ) : (
                  <table className="text-xs font-mono w-full">
                    <thead>
                      <tr>
                        <th className="text-left">Code</th>
                        <th className="text-left">Pole No</th>
                        <th className="text-left">Region</th>
                        <th className="text-left">Type</th>
                        <th className="text-left">Capacity</th>
                        <th className="text-left">Location</th>
                        <th className="text-left">Status</th>
                        <th className="text-left">Last Inspection</th>
                        <th className="text-left">Created</th>
                        <th className="text-left">Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transformers.map(t => (
                        <tr key={t.id}>
                          <td>{t.code}</td>
                          <td>{t.pole_no}</td>
                          <td>{t.region}</td>
                          <td>{t.type}</td>
                          <td>{t.capacity}</td>
                          <td>{t.location}</td>
                          <td>{t.status}</td>
                          <td>{t.last_inspection}</td>
                          <td>{t.created_at}</td>
                          <td>{t.updated_at}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="mb-4">
                <Label className="font-serif mb-1 block">PostgreSQL Table Schema</Label>
                <pre className="bg-muted rounded p-3 text-xs overflow-x-auto font-mono">
{`CREATE TABLE transformers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  pole_no text,
  region text,
  type text,
  capacity text,
  location text,
  status text check (status in ('normal','warning','critical')) default 'normal',
  last_inspection timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);`}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Feedback Logging Database Schema */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-sans">Feedback Logging System</CardTitle>
              <CardDescription className="font-serif">
                Database table for storing user feedback on AI-generated anomaly detections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <Label className="font-serif mb-1 block">Table Status</Label>
                  <p className="text-sm text-muted-foreground font-serif">
                    {checkingFeedbackTable ? (
                      "Checking..."
                    ) : feedbackTableExists ? (
                      <span className="text-green-600">✓ feedback_logs table exists</span>
                    ) : (
                      <span className="text-amber-600">⚠ feedback_logs table not found - create it below</span>
                    )}
                  </p>
                </div>
                {feedbackTableExists && (
                  <Button size="sm" onClick={handleFeedbackSeed} disabled={feedbackSeeding}>
                    {feedbackSeeding ? "Seeding..." : "Add Sample Data"}
                  </Button>
                )}
              </div>

              {!feedbackTableExists && (
                <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded">
                  <p className="text-sm font-serif mb-2">
                    <strong>Setup Required:</strong> The feedback_logs table needs to be created in your Supabase database.
                  </p>
                  <ol className="text-xs font-serif list-decimal list-inside space-y-1 mb-3">
                    <li>Open your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Supabase Dashboard</a></li>
                    <li>Click <strong>SQL Editor</strong> in the left sidebar</li>
                    <li>Click <strong>New Query</strong></li>
                    <li>Copy the SQL below and paste it into the editor</li>
                    <li>Click <strong>Run</strong> (or press Ctrl+Enter)</li>
                    <li>Refresh this page to verify</li>
                  </ol>
                </div>
              )}

              <div className="mb-4">
                <Label className="font-serif mb-1 block">PostgreSQL Table Schema</Label>
                <pre className="bg-muted rounded p-3 text-xs overflow-x-auto font-mono whitespace-pre">
{FEEDBACK_TABLE_SQL}
                </pre>
              </div>

              <div className="mb-4">
                <Label className="font-serif mb-1 block">Table Structure</Label>
                <div className="text-xs font-mono bg-muted rounded p-3">
                  <div className="grid grid-cols-3 gap-2 font-bold mb-2">
                    <div>Column</div>
                    <div>Type</div>
                    <div>Description</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>id</div>
                    <div>UUID</div>
                    <div>Primary key (auto-generated)</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>image_id</div>
                    <div>VARCHAR(255)</div>
                    <div>Thermal image identifier</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>model_predicted_anomalies</div>
                    <div>JSONB</div>
                    <div>AI model predictions</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>final_accepted_annotations</div>
                    <div>JSONB</div>
                    <div>User-verified annotations</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>annotator_metadata</div>
                    <div>JSONB</div>
                    <div>Annotator info & timestamp</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>created_at</div>
                    <div>TIMESTAMPTZ</div>
                    <div>Record creation time</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Temperature Thresholds */}
          <Card>
            <CardHeader>
              <CardTitle className="font-sans">Temperature Thresholds</CardTitle>
              <CardDescription className="font-serif">Set temperature limits for anomaly detection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="warningTemp" className="font-serif">
                  Warning Temperature (°C)
                </Label>
                <Input id="warningTemp" type="number" defaultValue="85" className="font-serif" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="criticalTemp" className="font-serif">
                  Critical Temperature (°C)
                </Label>
                <Input id="criticalTemp" type="number" defaultValue="95" className="font-serif" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxTemp" className="font-serif">
                  Maximum Safe Temperature (°C)
                </Label>
                <Input id="maxTemp" type="number" defaultValue="105" className="font-serif" />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="font-sans">Notifications</CardTitle>
              <CardDescription className="font-serif">Configure alert and notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="font-serif">Email Alerts</Label>
                  <p className="text-sm text-muted-foreground font-serif">
                    Receive email notifications for critical alerts
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="font-serif">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground font-serif">Get SMS alerts for emergency situations</p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="font-serif">Daily Reports</Label>
                  <p className="text-sm text-muted-foreground font-serif">Receive daily inspection summary reports</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="font-sans">AI Analysis</CardTitle>
              <CardDescription className="font-serif">Configure automated analysis parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sensitivity" className="font-serif">
                  Detection Sensitivity
                </Label>
                <Input id="sensitivity" type="range" min="1" max="10" defaultValue="7" className="font-serif" />
                <div className="flex justify-between text-xs text-muted-foreground font-serif">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="font-serif">Auto-Analysis</Label>
                  <p className="text-sm text-muted-foreground font-serif">Automatically analyze uploaded images</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="font-sans">System</CardTitle>
              <CardDescription className="font-serif">General system configuration options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="timezone" className="font-serif">
                  Timezone
                </Label>
                <Input id="timezone" defaultValue="Asia/Colombo" className="font-serif" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="language" className="font-serif">
                  Language
                </Label>
                <Input id="language" defaultValue="English" className="font-serif" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="font-serif">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground font-serif">Enable dark theme interface</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button className="font-serif">
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}
